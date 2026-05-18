import {
  MealType,
  RecipeCategory,
  RecipeGenreValue,
} from "@prisma/client";

export const recipeSortOptions = ["savedAt", "difficulty", "title"] as const;
export const recipeOrderOptions = ["asc", "desc"] as const;
export const recipeViewOptions = ["gallery", "table"] as const;

export type RecipeSort = (typeof recipeSortOptions)[number];
export type RecipeOrder = (typeof recipeOrderOptions)[number];
export type RecipeView = (typeof recipeViewOptions)[number];

export type RecipeListParams = {
  q: string;
  category?: RecipeCategory;
  genres: RecipeGenreValue[];
  mealTypes: MealType[];
  difficultyMin?: number;
  difficultyMax?: number;
  favorite: boolean;
  sort: RecipeSort;
  order: RecipeOrder;
  view: RecipeView;
};

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsReader = {
  getAll(key: string): string[];
};

const categoryValues = new Set<string>(Object.values(RecipeCategory));
const genreValues = new Set<string>(Object.values(RecipeGenreValue));
const mealTypeValues = new Set<string>(Object.values(MealType));
const sortValues = new Set<string>(recipeSortOptions);
const orderValues = new Set<string>(recipeOrderOptions);
const viewValues = new Set<string>(recipeViewOptions);

function valuesOf(source: SearchParamsReader | SearchParamsRecord, key: string) {
  if ("getAll" in source && typeof source.getAll === "function") {
    return source.getAll(key);
  }

  const record = source as SearchParamsRecord;
  const value = record[key];
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function firstOf(source: SearchParamsReader | SearchParamsRecord, key: string) {
  return valuesOf(source, key)[0] ?? "";
}

function uniqueEnumValues<T extends string>(values: string[], allowed: Set<string>) {
  return Array.from(new Set(values.filter((value): value is T => allowed.has(value))));
}

function parseDifficulty(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(parsed, 1), 5);
}

export function parseRecipeListSearchParams(
  source: SearchParamsReader | SearchParamsRecord = {},
): RecipeListParams {
  const category = firstOf(source, "category");
  const difficultyMin = parseDifficulty(firstOf(source, "difficultyMin"));
  const difficultyMax = parseDifficulty(firstOf(source, "difficultyMax"));
  const sort = firstOf(source, "sort");
  const order = firstOf(source, "order");
  const view = firstOf(source, "view");
  const normalizedMin =
    difficultyMin != null && difficultyMax != null
      ? Math.min(difficultyMin, difficultyMax)
      : difficultyMin;
  const normalizedMax =
    difficultyMin != null && difficultyMax != null
      ? Math.max(difficultyMin, difficultyMax)
      : difficultyMax;

  return {
    q: firstOf(source, "q").trim(),
    category: categoryValues.has(category) ? (category as RecipeCategory) : undefined,
    genres: uniqueEnumValues<RecipeGenreValue>(valuesOf(source, "genre"), genreValues),
    mealTypes: uniqueEnumValues<MealType>(valuesOf(source, "mealType"), mealTypeValues),
    difficultyMin: normalizedMin,
    difficultyMax: normalizedMax,
    favorite: firstOf(source, "favorite") === "true",
    sort: sortValues.has(sort) ? (sort as RecipeSort) : "savedAt",
    order: orderValues.has(order) ? (order as RecipeOrder) : "desc",
    view: viewValues.has(view) ? (view as RecipeView) : "gallery",
  };
}
