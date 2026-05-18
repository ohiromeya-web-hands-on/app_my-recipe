import { describe, expect, test, vi } from "vitest";
import { runDailyMaintenance } from "../features/maintenance/daily-maintenance";

describe("runDailyMaintenance", () => {
  test("purges recipes and orphan shopping items older than 30 days", async () => {
    const recipeDeleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const shoppingItemDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const transactionClient = {
      recipe: { deleteMany: recipeDeleteMany },
      shoppingItem: { deleteMany: shoppingItemDeleteMany },
    };
    const client = {
      $transaction: vi.fn((callback) => callback(transactionClient)),
    };
    const now = new Date("2026-05-18T00:00:00.000Z");

    await expect(runDailyMaintenance(client as never, now)).resolves.toEqual({
      cutoff: "2026-04-18T00:00:00.000Z",
      deletedRecipes: 2,
      deletedShoppingItems: 1,
    });

    expect(recipeDeleteMany).toHaveBeenCalledWith({
      where: {
        deletedAt: {
          lt: new Date("2026-04-18T00:00:00.000Z"),
        },
      },
    });
    expect(shoppingItemDeleteMany).toHaveBeenCalledWith({
      where: {
        deletedAt: {
          lt: new Date("2026-04-18T00:00:00.000Z"),
        },
        recipeIngredients: {
          none: {},
        },
      },
    });
  });
});
