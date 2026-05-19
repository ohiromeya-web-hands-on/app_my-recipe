import { ShoppingCategory } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  shoppingCategoryLabel,
  shoppingCategoryOptions,
} from "../features/recipes/view-labels";

describe("shoppingCategoryOptions", () => {
  it("keeps the UI display order independent from Prisma enum declaration order", () => {
    expect(shoppingCategoryOptions).toEqual([
      ShoppingCategory.VEGETABLE,
      ShoppingCategory.DAIRY,
      ShoppingCategory.MEAT,
      ShoppingCategory.FISH,
      ShoppingCategory.SEASONING,
      ShoppingCategory.OTHER,
    ]);
  });

  it("has a label for every displayed shopping category", () => {
    expect(
      shoppingCategoryOptions.map((category) => shoppingCategoryLabel(category)),
    ).toEqual(["野菜", "乳製品", "肉", "魚", "調味料", "その他"]);
  });

  it("includes every shopping category exactly once", () => {
    expect([...shoppingCategoryOptions].sort()).toEqual(
      Object.values(ShoppingCategory).sort(),
    );
  });
});
