import { afterEach, describe, expect, test, vi } from "vitest";
import { runDailyMaintenance } from "../features/maintenance/daily-maintenance";

describe("runDailyMaintenance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test("purges recipes and orphan shopping items older than 30 days", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
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
      recipeImageGcSkipped: true,
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
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    const referencedUrl = "https://blob.vercel-storage.com/recipe-images/kept.webp";
    const unreferencedUrl = "https://blob.vercel-storage.com/recipe-images/orphan.webp";
    const freshUnreferencedUrl = "https://blob.vercel-storage.com/recipe-images/fresh.webp";
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
            uploadedAt: new Date("2026-05-16T00:00:00.000Z"),
            etag: "kept",
          },
          {
            url: unreferencedUrl,
            downloadUrl: unreferencedUrl,
            pathname: "recipe-images/orphan.webp",
            size: 100,
            uploadedAt: new Date("2026-05-16T00:00:00.000Z"),
            etag: "orphan",
          },
          {
            url: freshUnreferencedUrl,
            downloadUrl: freshUnreferencedUrl,
            pathname: "recipe-images/fresh.webp",
            size: 100,
            uploadedAt: new Date("2026-05-17T12:00:00.000Z"),
            etag: "fresh",
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
      recipeImageGcSkipped: false,
    });

    expect(blobClient.list).toHaveBeenCalledWith({
      prefix: "recipe-images/",
      cursor: undefined,
    });
    expect(blobClient.del).toHaveBeenCalledWith([unreferencedUrl]);
  });

  test("skips blob deletion when BLOB_READ_WRITE_TOKEN is unset", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const recipeDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const recipeFindMany = vi.fn().mockResolvedValue([]);
    const shoppingItemDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const transactionClient = {
      recipe: { deleteMany: recipeDeleteMany, findMany: recipeFindMany },
      shoppingItem: { deleteMany: shoppingItemDeleteMany },
    };
    const client = {
      $transaction: vi.fn((callback) => callback(transactionClient)),
    };
    const blobClient = {
      list: vi.fn(),
      del: vi.fn(),
    };

    await expect(runDailyMaintenance(client as never, new Date("2026-05-18T00:00:00.000Z"), blobClient)).resolves.toEqual({
      cutoff: "2026-04-18T00:00:00.000Z",
      deletedRecipes: 0,
      deletedShoppingItems: 0,
      deletedRecipeImages: 0,
      recipeImageGcSkipped: true,
    });

    expect(blobClient.list).not.toHaveBeenCalled();
    expect(blobClient.del).not.toHaveBeenCalled();
  });

  test("throws when blob list pagination is missing a cursor", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");

    const recipeDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const recipeFindMany = vi.fn().mockResolvedValue([]);
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
        blobs: [],
        hasMore: true,
      }),
      del: vi.fn(),
    };

    await expect(
      runDailyMaintenance(client as never, new Date("2026-05-18T00:00:00.000Z"), blobClient),
    ).rejects.toThrow("Vercel Blob list returned hasMore without cursor");

    expect(blobClient.del).not.toHaveBeenCalled();
  });
});
