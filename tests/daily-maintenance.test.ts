import { afterEach, describe, expect, test, vi } from "vitest";
import { runDailyMaintenance } from "../features/maintenance/daily-maintenance";

describe("runDailyMaintenance", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("purges recipes and orphan shopping items older than 30 days", async () => {
    const recipeDeleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const recipeFindMany = vi.fn().mockResolvedValue([]);
    const shoppingItemDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const transactionClient = {
      recipe: { deleteMany: recipeDeleteMany, findMany: recipeFindMany },
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
      deletedRecipeImages: 0,
    });

    expect(recipeDeleteMany).toHaveBeenCalledWith({
      where: {
        deletedAt: {
          lt: new Date("2026-04-18T00:00:00.000Z"),
        },
      },
    });
    expect(recipeFindMany).toHaveBeenCalledWith({
      where: {
        imageUrl: {
          not: null,
        },
      },
      select: {
        imageUrl: true,
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

  test("deletes only unreferenced recipe image blobs", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");

    const referencedUrl = "https://blob.vercel-storage.com/recipe-images/kept.webp";
    const unreferencedUrl = "https://blob.vercel-storage.com/recipe-images/orphan.webp";
    const recipeDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const recipeFindMany = vi.fn().mockResolvedValue([{ imageUrl: referencedUrl }]);
    const shoppingItemDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const transactionClient = {
      recipe: { deleteMany: recipeDeleteMany, findMany: recipeFindMany },
      shoppingItem: { deleteMany: shoppingItemDeleteMany },
    };
    const client = {
      $transaction: vi.fn((callback) => callback(transactionClient)),
    };
    const blobClient = {
      list: vi.fn().mockResolvedValue({
        blobs: [
          {
            url: referencedUrl,
            downloadUrl: referencedUrl,
            pathname: "recipe-images/kept.webp",
            size: 100,
            uploadedAt: new Date("2026-05-17T00:00:00.000Z"),
            etag: "kept",
          },
          {
            url: unreferencedUrl,
            downloadUrl: unreferencedUrl,
            pathname: "recipe-images/orphan.webp",
            size: 100,
            uploadedAt: new Date("2026-05-17T00:00:00.000Z"),
            etag: "orphan",
          },
        ],
        hasMore: false,
      }),
      del: vi.fn().mockResolvedValue(undefined),
    };

    await expect(runDailyMaintenance(client as never, new Date("2026-05-18T00:00:00.000Z"), blobClient)).resolves.toEqual({
      cutoff: "2026-04-18T00:00:00.000Z",
      deletedRecipes: 0,
      deletedShoppingItems: 0,
      deletedRecipeImages: 1,
    });

    expect(blobClient.list).toHaveBeenCalledWith({
      prefix: "recipe-images/",
      cursor: undefined,
    });
    expect(blobClient.del).toHaveBeenCalledWith([unreferencedUrl]);
  });
});
