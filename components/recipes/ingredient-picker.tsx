"use client";

import { useEffect, useState, useTransition } from "react";
import { ShoppingCategory } from "@prisma/client";
import {
  searchShoppingItem,
  type ShoppingItemCandidate,
} from "@/features/shopping/actions";
import {
  shoppingCategoryLabel,
  shoppingCategoryOptions,
} from "@/features/recipes/view-labels";
import { normalizeShoppingItemName } from "@/lib/normalize";

export type IngredientPickerValue = {
  shoppingItemId?: string;
  name?: string;
  amountMemo?: string;
  category: ShoppingCategory;
};

type IngredientPickerProps = {
  index: number;
  value: IngredientPickerValue;
  onChange: (value: IngredientPickerValue) => void;
  onRemove: () => void;
};

export function IngredientPicker({
  index,
  value,
  onChange,
  onRemove,
}: IngredientPickerProps) {
  const [query, setQuery] = useState(value.name ?? "");
  const [candidates, setCandidates] = useState<ShoppingItemCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = normalizeShoppingItemName(query);
  const selectedCandidate = value.shoppingItemId ? value.name : null;
  const hasExactCandidate = candidates.some(
    (candidate) => candidate.normalizedName === normalizedQuery,
  );

  useEffect(() => {
    setQuery(value.name ?? "");
  }, [value.name, value.shoppingItemId]);

  useEffect(() => {
    let canceled = false;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setCandidates([]);
      setMessage(null);
      return () => {
        canceled = true;
      };
    }

    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchShoppingItem(trimmedQuery);
        if (canceled) {
          return;
        }

        if (!result.ok) {
          setMessage(result.error.message);
          setCandidates([]);
          return;
        }

        setMessage(null);
        setCandidates(result.data);
      });
    }, 180);

    return () => {
      canceled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const update = (next: Partial<IngredientPickerValue>) => {
    onChange({
      ...value,
      ...next,
    });
  };

  const selectCandidate = (candidate: ShoppingItemCandidate) => {
    setQuery(candidate.name);
    onChange({
      ...value,
      shoppingItemId: candidate.id,
      name: candidate.name,
      category: candidate.category,
    });
  };

  const useNewIngredient = () => {
    update({
      shoppingItemId: undefined,
      name: query,
    });
  };

  return (
    <div className="ingredient-picker">
      <div className="ingredient-row-heading">
        <strong>材料 {index + 1}</strong>
        <button type="button" className="secondary-button" onClick={onRemove}>
          削除
        </button>
      </div>

      <div className="ingredient-grid">
        <label className="field">
          <span>材料名</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              update({
                shoppingItemId: undefined,
                name: event.target.value,
              });
            }}
            maxLength={40}
          />
        </label>

        <label className="field">
          <span>分量メモ</span>
          <input
            value={value.amountMemo ?? ""}
            onChange={(event) => update({ amountMemo: event.target.value })}
            maxLength={80}
          />
        </label>

        <label className="field">
          <span>カテゴリー</span>
          <select
            value={value.category}
            disabled={Boolean(value.shoppingItemId)}
            onChange={(event) =>
              update({ category: event.target.value as ShoppingCategory })
            }
          >
            {shoppingCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {shoppingCategoryLabel(category)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedCandidate ? (
        <p className="ingredient-selected">既存材料「{selectedCandidate}」を使用します。</p>
      ) : null}

      {message ? <p className="field-error">{message}</p> : null}

      {query.trim() ? (
        <div className="ingredient-suggestions">
          <span>既存候補</span>
          {isPending ? <p className="muted-text">検索中...</p> : null}
          {!isPending && candidates.length === 0 ? (
            <p className="muted-text">候補はありません。</p>
          ) : null}
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="ingredient-candidate"
              onClick={() => selectCandidate(candidate)}
            >
              <span>{candidate.name}</span>
              <small>{shoppingCategoryLabel(candidate.category as ShoppingCategory)}</small>
            </button>
          ))}

          <button
            type="button"
            className="ingredient-new"
            onClick={useNewIngredient}
            disabled={!query.trim() || hasExactCandidate}
          >
            「{query.trim()}」を新規作成
          </button>
          {hasExactCandidate ? (
            <p className="muted-text">同じ正規化名の材料があります。既存候補を選択してください。</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
