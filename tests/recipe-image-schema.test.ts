import { MealType, RecipeCategory } from "@prisma/client";
import { describe, expect, test } from "vitest";
import { recipeFormSchema } from "../features/recipes/schema";

const validRecipe = {
  title: "鶏むねの照り焼き",
  emoji: "",
  imageUrl: "",
  imageAlt: "",
  category: RecipeCategory.MAIN,
  genres: [],
  mealTypes: [MealType.DINNER],
  difficulty: 2,
  servings: 2,
  referenceUrl: "",
  memoMarkdown: "",
  savedAt: new Date("2026-05-18T00:00:00+09:00"),
  isFavorite: false,
  steps: [{ content: "焼く" }],
  ingredients: [],
};

describe("recipeFormSchema image fields", () => {
  test("allows empty image alt when no image URL is set", () => {
    expect(recipeFormSchema.safeParse(validRecipe).success).toBe(true);
  });

  test("requires image alt when image URL is set", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      imageUrl: "https://example.com/recipe.webp",
      imageAlt: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["imageAlt"],
          }),
        ]),
      );
    }
  });
});
