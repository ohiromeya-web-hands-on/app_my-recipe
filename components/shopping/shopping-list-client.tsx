"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  restoreShoppingItemStates,
  togglePurchased,
} from "@/features/shopping/actions";
import type {
  ShoppingItemWithRecipes,
  ShoppingTab,
} from "@/features/shopping/queries";
import {
  shoppingCategoryLabel,
  shoppingStatusLabel,
} from "@/features/recipes/view-labels";

type ShoppingListClientProps = {
  initialItems: ShoppingItemWithRecipes[];
  tab: ShoppingTab;
};

type ShoppingOptimisticAction =
  | { type: "replace"; item: ShoppingItemWithRecipes }
  | { type: "restore"; items: ShoppingItemWithRecipes[] };

type UndoToast = {
  id: string;
  message: string;
  items: ShoppingItemWithRecipes[];
  ready: boolean;
};

function applyItemState(
  item: ShoppingItemWithRecipes,
  state: ShoppingItemWithRecipes,
): ShoppingItemWithRecipes {
  return {
    ...item,
    purchased: state.purchased,
    status: state.status,
  };
}

function toState(item: ShoppingItemWithRecipes) {
  return {
    id: item.id,
    purchased: item.purchased,
    status: item.status,
  };
}

function toToggledItems(items: ShoppingItemWithRecipes[]) {
  return items.map((item) => ({
    ...item,
    purchased: !item.purchased,
  }));
}

function replaceState(
  items: ShoppingItemWithRecipes[],
  next: ShoppingItemWithRecipes,
  tab: ShoppingTab,
) {
  const purchased = tab === "purchased";
  const exists = items.some((item) => item.id === next.id);
  const nextItems = exists
    ? items.map((item) => (item.id === next.id ? next : item))
    : [next, ...items];

  return nextItems.filter((item) => item.purchased === purchased);
}

function restoreStates(
  items: ShoppingItemWithRecipes[],
  states: ShoppingItemWithRecipes[],
  tab: ShoppingTab,
) {
  const purchased = tab === "purchased";
  const restoredItems = states.reduce((current, state) => {
    const exists = current.some((item) => item.id === state.id);
    if (exists) {
      return current.map((item) =>
        item.id === state.id ? applyItemState(item, state) : item,
      );
    }

    return [state, ...current];
  }, items);

  return restoredItems
    .map((item) => {
      const state = states.find((candidate) => candidate.id === item.id);
      return state ? applyItemState(item, state) : item;
    })
    .filter((item) => item.purchased === purchased);
}

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ShoppingListClient({ initialItems, tab }: ShoppingListClientProps) {
  const [items, setItems] = useState(initialItems);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (current, action: ShoppingOptimisticAction) => {
      if (action.type === "replace") {
        return replaceState(current, action.item, tabRef.current);
      }

      return restoreStates(current, action.items, tabRef.current);
    },
  );
  const [toasts, setToasts] = useState<UndoToast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    setItems(initialItems);
    setError(null);
  }, [initialItems, tab]);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timeout) => window.clearTimeout(timeout));
      currentTimers.clear();
    };
  }, []);

  const emptyMessage = useMemo(() => {
    return tab === "active"
      ? "買うものはありません。レシピの材料から買い物項目を追加できます。"
      : "購入済みの項目はありません。";
  }, [tab]);

  const startToastTimer = (toastId: string) => {
    const existingTimeout = timers.current.get(toastId);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const timeout = window.setTimeout(() => {
      timers.current.delete(toastId);
      setToasts((current) => current.filter((item) => item.id !== toastId));
    }, 5000);
    timers.current.set(toastId, timeout);
  };

  const addUndoToast = (toast: UndoToast) => {
    setToasts((current) => [...current, toast]);
  };

  const markToastReady = (toastId: string) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === toastId ? { ...toast, ready: true } : toast,
      ),
    );
    startToastTimer(toastId);
  };

  const removeToast = (toastId: string) => {
    const timeout = timers.current.get(toastId);
    if (timeout) {
      window.clearTimeout(timeout);
      timers.current.delete(toastId);
    }
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const handleToggle = (item: ShoppingItemWithRecipes) => {
    const nextItem = { ...item, purchased: !item.purchased };
    const toast: UndoToast = {
      id: makeToastId(),
      message: item.purchased
        ? `「${item.name}」を買うものに戻しました`
        : `「${item.name}」を購入済みにしました`,
      items: [item],
      ready: false,
    };

    startTransition(async () => {
      setError(null);
      addOptimistic({ type: "replace", item: nextItem });
      addUndoToast(toast);

      const result = await togglePurchased(item.id, nextItem.purchased);
      if (!result.ok) {
        removeToast(toast.id);
        setError(result.error.message);
        addOptimistic({ type: "restore", items: [item] });
        return;
      }

      markToastReady(toast.id);
      setItems((current) => replaceState(current, nextItem, tabRef.current));
    });
  };

  const handleUndo = (toast: UndoToast) => {
    if (!toast.ready) {
      return;
    }

    startTransition(async () => {
      removeToast(toast.id);
      addOptimistic({ type: "restore", items: toast.items });
      const result = await restoreShoppingItemStates(toast.items.map(toState));
      if (!result.ok) {
        for (const item of toToggledItems(toast.items)) {
          addOptimistic({ type: "replace", item });
        }
        setError(result.error.message);
        return;
      }

      setItems((current) => restoreStates(current, toast.items, tabRef.current));
    });
  };

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}

      {optimisticItems.length > 0 ? (
        <div className="shopping-table" role="list">
          {optimisticItems.map((item) => (
            <article className="shopping-row" key={item.id} role="listitem">
              <label className="shopping-check">
                <input
                  type="checkbox"
                  checked={item.purchased}
                  onChange={() => handleToggle(item)}
                />
                <span>{item.name}</span>
              </label>
              <div className="shopping-row-meta">
                <span>{shoppingCategoryLabel(item.category)}</span>
                <span>{shoppingStatusLabel(item.status)}</span>
              </div>
              <div className="shopping-row-recipes">
                {item.recipeIngredients.length > 0 ? (
                  item.recipeIngredients.slice(0, 3).map(({ recipe }) => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                      {recipe.title}
                    </Link>
                  ))
                ) : (
                  <span>単独項目</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state large">
          <strong>{emptyMessage}</strong>
        </div>
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className="undo-toast" key={toast.id}>
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => handleUndo(toast)}
              disabled={!toast.ready}
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
