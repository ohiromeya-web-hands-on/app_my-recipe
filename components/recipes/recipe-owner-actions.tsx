"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  restoreRecipe,
  softDeleteRecipe,
} from "@/features/recipes/actions";

type RecipeOwnerActionsProps = {
  recipeId: string;
};

export function RecipeOwnerActions({ recipeId }: RecipeOwnerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toastVisible, setToastVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const deleteRecipe = () => {
    if (!window.confirm("このレシピを削除しますか？")) {
      return;
    }

    startTransition(async () => {
      const result = await softDeleteRecipe(recipeId);
      if (!result.ok) {
        window.alert(result.error.message);
        return;
      }

      setToastVisible(true);
      timerRef.current = setTimeout(() => {
        setToastVisible(false);
        router.push("/recipes");
        router.refresh();
      }, 5000);
    });
  };

  const undoDelete = () => {
    startTransition(async () => {
      const result = await restoreRecipe(recipeId);
      if (!result.ok) {
        window.alert(result.error.message);
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToastVisible(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="owner-action-row">
        <Link className="secondary-button" href={`/recipes/${recipeId}/edit`}>
          編集
        </Link>
        <button
          type="button"
          className="danger-button"
          onClick={deleteRecipe}
          disabled={isPending}
        >
          削除
        </button>
      </div>
      {toastVisible ? (
        <div className="undo-toast" role="status">
          <span>レシピを削除しました</span>
          <button type="button" onClick={undoDelete} disabled={isPending}>
            元に戻す
          </button>
        </div>
      ) : null}
    </>
  );
}
