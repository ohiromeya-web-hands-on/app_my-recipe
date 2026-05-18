import type { Prisma, PrismaClient } from "@prisma/client";
import { del, list, type ListBlobResultBlob } from "@vercel/blob";
import { prisma } from "../../lib/prisma";

export type DailyMaintenanceResult = {
  cutoff: string;
  deletedRecipes: number;
  deletedShoppingItems: number;
  deletedRecipeImages: number;
  recipeImageGcSkipped: boolean;
};

const RETENTION_DAYS = 30;
const RECIPE_IMAGE_PREFIX = "recipe-images/";
const RECIPE_IMAGE_GC_SAFETY_WINDOW_MS = 24 * 60 * 60 * 1000;

type BlobListResult = {
  blobs: ListBlobResultBlob[];
  cursor?: string;
  hasMore: boolean;
};

type RecipeImageBlobClient = {
  list: (options: { prefix: string; cursor?: string }) => Promise<BlobListResult>;
  del: (urlOrPathname: string[] | string) => Promise<void>;
};

const vercelBlobClient: RecipeImageBlobClient = {
  list,
  del,
};

export function maintenanceCutoff(now = new Date()) {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

async function listRecipeImageBlobs(blobClient: RecipeImageBlobClient) {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;

  do {
    const result = await blobClient.list({
      prefix: RECIPE_IMAGE_PREFIX,
      cursor,
    });
    blobs.push(...result.blobs);
    if (result.hasMore && !result.cursor) {
      throw new Error("Vercel Blob list returned hasMore without cursor");
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return blobs;
}

async function deleteUnreferencedRecipeImages(
  referencedImageUrls: Set<string>,
  blobClient: RecipeImageBlobClient,
  now: Date,
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("recipe image GC skipped because BLOB_READ_WRITE_TOKEN is not configured");
    return { deletedRecipeImages: 0, recipeImageGcSkipped: true };
  }

  const safetyWindowCutoff = now.getTime() - RECIPE_IMAGE_GC_SAFETY_WINDOW_MS;
  const blobs = await listRecipeImageBlobs(blobClient);
  const unreferencedUrls = blobs
    // Keep this prefix guard even though list() is prefix-filtered, so a bad client cannot delete outside recipe images.
    .filter((blob) => blob.pathname.startsWith(RECIPE_IMAGE_PREFIX))
    .filter((blob) => blob.uploadedAt.getTime() < safetyWindowCutoff)
    .filter((blob) => !referencedImageUrls.has(blob.url))
    .map((blob) => blob.url);

  if (unreferencedUrls.length === 0) {
    return { deletedRecipeImages: 0, recipeImageGcSkipped: false };
  }

  await blobClient.del(unreferencedUrls);
  console.info("deleted unreferenced recipe image blobs", {
    count: unreferencedUrls.length,
    sample: unreferencedUrls.slice(0, 5),
  });

  return { deletedRecipeImages: unreferencedUrls.length, recipeImageGcSkipped: false };
}

export async function runDailyMaintenance(
  client: PrismaClient | Prisma.TransactionClient = prisma,
  now = new Date(),
  blobClient: RecipeImageBlobClient = vercelBlobClient,
): Promise<DailyMaintenanceResult> {
  const cutoff = maintenanceCutoff(now);
  const run = async (tx: Prisma.TransactionClient) => {
    const deletedRecipes = await tx.recipe.deleteMany({
      where: {
        deletedAt: {
          lt: cutoff,
        },
      },
    });

    const deletedShoppingItems = await tx.shoppingItem.deleteMany({
      where: {
        deletedAt: {
          lt: cutoff,
        },
        recipeIngredients: {
          none: {},
        },
      },
    });

    const referencedRecipeImages = await tx.recipe.findMany({
      where: {
        imageUrl: {
          not: null,
        },
      },
      select: {
        imageUrl: true,
      },
    });

    return {
      cutoff: cutoff.toISOString(),
      deletedRecipes: deletedRecipes.count,
      deletedShoppingItems: deletedShoppingItems.count,
      referencedRecipeImageUrls: new Set(
        referencedRecipeImages
          .map((recipe) => recipe.imageUrl)
          .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
      ),
    };
  };

  const dbResult = "$transaction" in client ? await client.$transaction(run) : await run(client);
  const imageGcResult = await deleteUnreferencedRecipeImages(
    dbResult.referencedRecipeImageUrls,
    blobClient,
    now,
  );

  return {
    cutoff: dbResult.cutoff,
    deletedRecipes: dbResult.deletedRecipes,
    deletedShoppingItems: dbResult.deletedShoppingItems,
    deletedRecipeImages: imageGcResult.deletedRecipeImages,
    recipeImageGcSkipped: imageGcResult.recipeImageGcSkipped,
  };
}
