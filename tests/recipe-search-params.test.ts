import {
  MealType,
  RecipeCategory,
  RecipeGenreValue,
} from "@prisma/client";
import { describe, expect, test } from "vitest";
import { parseRecipeListSearchParams } from "../features/recipes/search-params";

describe("parseRecipeListSearchParams", () => {
  test("parses repeated genre and mealType values", () => {
    const params = new URLSearchParams();
    params.append("genre", RecipeGenreValue.WASHOKU);
    params.append("genre", RecipeGenreValue.CHINESE);
    params.append("mealType", MealType.LUNCH);
    params.append("mealType", MealType.DINNER);

    expect(parseRecipeListSearchParams(params)).toMatchObject({
      genres: [RecipeGenreValue.WASHOKU, RecipeGenreValue.CHINESE],
      mealTypes: [MealType.LUNCH, MealType.DINNER],
    });
  });

  test("normalizes invalid and reversed range values", () => {
    const result = parseRecipeListSearchParams({
      category: RecipeCategory.MAIN,
      difficultyMin: "5",
      difficultyMax: "2",
      favorite: "true",
      sort: "title",
      order: "asc",
      view: "table",
    });

    expect(result).toMatchObject({
      category: RecipeCategory.MAIN,
      difficultyMin: 2,
      difficultyMax: 5,
      favorite: true,
      sort: "title",
      order: "asc",
      view: "table",
    });
  });
});
