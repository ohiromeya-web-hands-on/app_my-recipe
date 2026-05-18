"use client";

import {
  mealTypeOptions,
  recipeCategoryOptions,
  recipeGenreOptions,
} from "@/features/recipes/schema";
import {
  parseRecipeListSearchParams,
  type RecipeListParams,
  type RecipeOrder,
  type RecipeSort,
  type RecipeView,
} from "@/features/recipes/search-params";
import {
  categoryLabel,
  genreLabel,
  mealTypeLabel,
} from "@/features/recipes/view-labels";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";

type RecipeSearchFormValues = {
  q: string;
  category: string;
  genres: string[];
  mealTypes: string[];
  difficultyMin: string;
  difficultyMax: string;
  favorite: boolean;
  sort: RecipeSort;
  order: RecipeOrder;
  view: RecipeView;
};

function toFormValues(params: RecipeListParams): RecipeSearchFormValues {
  return {
    q: params.q,
    category: params.category ?? "",
    genres: params.genres,
    mealTypes: params.mealTypes,
    difficultyMin: params.difficultyMin?.toString() ?? "",
    difficultyMax: params.difficultyMax?.toString() ?? "",
    favorite: params.favorite,
    sort: params.sort,
    order: params.order,
    view: params.view,
  };
}

function writeParams(values: RecipeSearchFormValues) {
  const params = new URLSearchParams();
  const q = values.q.trim();

  if (q) {
    params.set("q", q);
  }
  if (values.category) {
    params.set("category", values.category);
  }
  for (const genre of values.genres ?? []) {
    params.append("genre", genre);
  }
  for (const mealType of values.mealTypes ?? []) {
    params.append("mealType", mealType);
  }
  if (values.difficultyMin) {
    params.set("difficultyMin", values.difficultyMin);
  }
  if (values.difficultyMax) {
    params.set("difficultyMax", values.difficultyMax);
  }
  if (values.favorite) {
    params.set("favorite", "true");
  }
  if (values.sort !== "savedAt") {
    params.set("sort", values.sort);
  }
  if (values.order !== "desc") {
    params.set("order", values.order);
  }
  if (values.view !== "gallery" || values.favorite) {
    params.set("view", values.view);
  }

  return params;
}

export function RecipeSearchPanel({ params }: { params: RecipeListParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const updateTimerRef = useRef<number | null>(null);
  const defaultValues = useMemo(() => toFormValues(params), [params]);
  const { register, reset, setValue, watch } = useForm<RecipeSearchFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(toFormValues(parseRecipeListSearchParams(searchParams)));
  }, [reset, searchParams, searchParamsKey]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (updateTimerRef.current) {
        window.clearTimeout(updateTimerRef.current);
      }

      updateTimerRef.current = window.setTimeout(() => {
        const nextParams = writeParams(values as RecipeSearchFormValues);
        const nextQuery = nextParams.toString();
        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        const currentUrl = searchParamsKey ? `${pathname}?${searchParamsKey}` : pathname;

        if (nextUrl !== currentUrl) {
          router.push(nextUrl, { scroll: false });
        }
      }, 250);
    });

    return () => {
      subscription.unsubscribe();
      if (updateTimerRef.current) {
        window.clearTimeout(updateTimerRef.current);
      }
    };
  }, [pathname, router, searchParamsKey, watch]);

  const setFavoriteView = () => {
    setValue("favorite", true, { shouldDirty: true });
    setValue("view", "gallery", { shouldDirty: true });
  };

  return (
    <aside className="recipe-search-panel" aria-label="レシピ検索条件">
      <div className="field">
        <span>検索</span>
        <input
          type="search"
          placeholder="レシピ名・メモを検索"
          {...register("q")}
        />
      </div>

      <div className="filter-row">
        <label className="field">
          <span>カテゴリー</span>
          <select {...register("category")}>
            <option value="">すべて</option>
            {recipeCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>表示</span>
          <select {...register("view")}>
            <option value="gallery">ギャラリー</option>
            <option value="table">テーブル</option>
          </select>
        </label>
      </div>

      <div className="filter-row">
        <label className="field">
          <span>難易度 min</span>
          <input type="number" min={1} max={5} {...register("difficultyMin")} />
        </label>
        <label className="field">
          <span>難易度 max</span>
          <input type="number" min={1} max={5} {...register("difficultyMax")} />
        </label>
      </div>

      <div className="filter-row">
        <label className="field">
          <span>ソート</span>
          <select {...register("sort")}>
            <option value="savedAt">保存日</option>
            <option value="difficulty">難易度</option>
            <option value="title">レシピ名</option>
          </select>
        </label>
        <label className="field">
          <span>順序</span>
          <select {...register("order")}>
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
        </label>
      </div>

      <fieldset className="filter-fieldset">
        <legend>ジャンル</legend>
        <div className="option-group">
          {recipeGenreOptions.map((genre) => (
            <label key={genre} className="check-chip">
              <input type="checkbox" value={genre} {...register("genres")} />
              <span>{genreLabel(genre)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="filter-fieldset">
        <legend>食事タイプ</legend>
        <div className="option-group">
          {mealTypeOptions.map((mealType) => (
            <label key={mealType} className="check-chip">
              <input type="checkbox" value={mealType} {...register("mealTypes")} />
              <span>{mealTypeLabel(mealType)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="filter-actions">
        <label className="check-chip">
          <input type="checkbox" {...register("favorite")} />
          <span>お気に入りのみ</span>
        </label>
        <button type="button" className="secondary-button" onClick={setFavoriteView}>
          お気に入りビュー
        </button>
      </div>
    </aside>
  );
}
