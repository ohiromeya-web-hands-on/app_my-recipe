"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  restoreMissingItems,
  restoreShoppingItemStates,
  type ShoppingItemState,
} from "@/features/shopping/actions";

type RestoreMissingItemsButtonProps = {
  recipeId: string;
  disabled: boolean;
};

export function RestoreMissingItemsButton({
  recipeId,
  disabled,
}: RestoreMissingItemsButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<ShoppingItemState[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => clearUndoTimer();
  }, []);

  const clearUndoTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRestore = () => {
    startTransition(async () => {
      clearUndoTimer();
      setMessage(null);
      const result = await restoreMissingItems(recipeId);
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }

      if (result.data.count === 0) {
        setMessage("買い物リストに戻す材料はありません。");
        setUndoState(null);
        return;
      }

      setUndoState(result.data.previousItems);
      setMessage(`${result.data.count}件の材料を買うものに戻しました。`);
      timerRef.current = window.setTimeout(() => {
        setUndoState(null);
        timerRef.current = null;
      }, 5000);
    });
  };

  const handleUndo = () => {
    if (!undoState) {
      return;
    }

    startTransition(async () => {
      clearUndoTimer();
      const result = await restoreShoppingItemStates(undoState);
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }

      setUndoState(null);
      setMessage("買い物リストの状態を元に戻しました。");
    });
  };

  return (
    <div className="restore-missing-action">
      <button
        type="button"
        className="secondary-button"
        onClick={handleRestore}
        disabled={disabled || isPending}
      >
        不足材料を買い物リストに戻す
      </button>
      {undoState ? (
        <button
          type="button"
          className="secondary-button"
          onClick={handleUndo}
          disabled={isPending}
        >
          Undo
        </button>
      ) : null}
      {message ? <p className="muted-text">{message}</p> : null}
    </div>
  );
}
