import {
  ShoppingCategory,
  type MealType,
  type RecipeCategory,
  type RecipeGenreValue,
  type ShoppingStatus,
} from "@prisma/client";

export function categoryLabel(category: RecipeCategory) {
  const labels: Record<RecipeCategory, string> = {
    MAIN: "主菜",
    SIDE: "副菜",
    SOUP: "汁物",
    DESSERT: "デザート",
    OTHER: "その他",
  };

  return labels[category];
}

export function genreLabel(genre: RecipeGenreValue) {
  const labels: Record<RecipeGenreValue, string> = {
    WASHOKU: "和食",
    YOSHOKU: "洋食",
    CHINESE: "中華",
  };

  return labels[genre];
}

export function mealTypeLabel(mealType: MealType) {
  const labels: Record<MealType, string> = {
    BREAKFAST: "朝食",
    LUNCH: "昼食",
    DINNER: "夕食",
  };

  return labels[mealType];
}

export function difficultyLabel(difficulty: number) {
  return `難易度 ${"★".repeat(Math.min(Math.max(difficulty, 1), 5))}`;
}

export function shoppingStatusLabel(status: ShoppingStatus) {
  const labels: Record<ShoppingStatus, string> = {
    NEED: "必要",
    STOCK: "在庫あり",
    OPTIONAL: "任意",
  };

  return labels[status];
}

export const shoppingCategoryOptions = [
  ShoppingCategory.VEGETABLE,
  ShoppingCategory.DAIRY,
  ShoppingCategory.MEAT,
  ShoppingCategory.FISH,
  ShoppingCategory.SEASONING,
  ShoppingCategory.OTHER,
] as const satisfies readonly ShoppingCategory[];

export function shoppingCategoryLabel(category: ShoppingCategory) {
  const labels: Record<ShoppingCategory, string> = {
    VEGETABLE: "野菜",
    MEAT: "肉",
    FISH: "魚",
    DAIRY: "乳製品",
    SEASONING: "調味料",
    OTHER: "その他",
  };

  return labels[category];
}
