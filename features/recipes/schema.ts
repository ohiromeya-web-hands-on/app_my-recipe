import {
  MealType,
  RecipeCategory,
  RecipeGenreValue,
  ShoppingCategory,
} from "@prisma/client";
import { z } from "zod";

export const recipeCategoryOptions = Object.values(RecipeCategory);
export const recipeGenreOptions = Object.values(RecipeGenreValue);
export const mealTypeOptions = Object.values(MealType);

const optionalUrl = z
  .preprocess(
    (value) => (value == null ? "" : value),
    z.string().trim().optional(),
  )
  .transform((value) => value || null)
  .pipe(z.string().url("URL の形式で入力してください").nullable())
  .refine(
    (value) => value == null || value.startsWith("http://") || value.startsWith("https://"),
    "http または https の URL を入力してください",
  );

const optionalShortText = (max: number) =>
  z
    .preprocess(
      (value) => (value == null ? "" : value),
      z.string().trim().max(max, `${max}文字以内で入力してください`).optional(),
    )
    .transform((value) => value || null);

export const recipeStepSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "手順を入力してください")
    .max(500, "手順は500文字以内で入力してください"),
});

export const recipeIngredientSchema = z
  .object({
    shoppingItemId: z.string().optional(),
    name: z.string().trim().max(40, "材料名は40文字以内で入力してください").optional(),
    amountMemo: z.string().trim().max(80, "分量メモは80文字以内で入力してください").optional(),
    category: z.nativeEnum(ShoppingCategory).default(ShoppingCategory.OTHER),
  })
  .refine(
    (value) => Boolean(value.shoppingItemId || value.name?.trim()),
    "材料名を入力するか、候補から材料を選択してください",
  );

function requireImageAlt(
  value: { imageUrl: string | null; imageAlt: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.imageUrl && !value.imageAlt) {
    ctx.addIssue({
      code: "custom",
      path: ["imageAlt"],
      message: "料理写真を登録する場合は写真の説明を入力してください",
    });
  }
}

const recipeFormBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "レシピ名を入力してください")
    .max(80, "レシピ名は80文字以内で入力してください"),
  emoji: optionalShortText(8),
  imageUrl: optionalUrl,
  imageAlt: optionalShortText(80),
  category: z.nativeEnum(RecipeCategory, {
    error: "カテゴリーを選択してください",
  }),
  genres: z.array(z.nativeEnum(RecipeGenreValue)).max(recipeGenreOptions.length).default([]),
  mealTypes: z.array(z.nativeEnum(MealType)).max(mealTypeOptions.length).default([]),
  difficulty: z.coerce
    .number()
    .int("難易度は整数で入力してください")
    .min(1, "難易度は1以上で入力してください")
    .max(5, "難易度は5以下で入力してください"),
  servings: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce
      .number()
      .int("人数は整数で入力してください")
      .min(1, "人数は1以上で入力してください")
      .max(20, "人数は20以下で入力してください")
      .nullable(),
  ),
  referenceUrl: optionalUrl,
  memoMarkdown: z.string().max(5000, "メモは5000文字以内で入力してください").default(""),
  savedAt: z.coerce.date({
    error: "保存日を入力してください",
  }),
  isFavorite: z.boolean().default(false),
  steps: z.array(recipeStepSchema).max(50, "手順は50件以内で入力してください").default([]),
  ingredients: z
    .array(recipeIngredientSchema)
    .max(80, "材料は80件以内で入力してください")
    .default([]),
});

export const recipeFormSchema = recipeFormBaseSchema.superRefine(requireImageAlt);

export const recipeUpdateSchema = recipeFormBaseSchema
  .extend({
    id: z.string().min(1),
    updatedAt: z.coerce.date({
      error: "更新日時が不正です",
    }),
  })
  .superRefine(requireImageAlt);

export type RecipeFormInput = z.input<typeof recipeFormSchema>;
export type RecipeFormValues = z.output<typeof recipeFormSchema>;
export type RecipeUpdateInput = z.input<typeof recipeUpdateSchema>;
export type RecipeUpdateValues = z.output<typeof recipeUpdateSchema>;
