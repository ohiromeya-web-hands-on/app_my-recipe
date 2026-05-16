import { describe, expect, test } from "vitest";
import { normalizeShoppingItemName } from "../lib/normalize";

describe("normalizeShoppingItemName", () => {
  test("trims surrounding whitespace", () => {
    expect(normalizeShoppingItemName(" 醤油 ")).toBe(
      normalizeShoppingItemName("醤油"),
    );
  });

  test("keeps kanji and hiragana distinct", () => {
    expect(normalizeShoppingItemName("醤油")).not.toBe(
      normalizeShoppingItemName("しょうゆ"),
    );
  });

  test("normalizes ASCII case", () => {
    expect(normalizeShoppingItemName("Salt")).toBe(
      normalizeShoppingItemName("salt"),
    );
  });

  test("normalizes full-width alphanumerics and repeated spaces", () => {
    expect(normalizeShoppingItemName(" ＳＡＬＴ　　100 ")).toBe("salt 100");
  });
});
