import type { Prisma, PrismaClient } from "@prisma/client";
import { del, list, type ListBlobResultBlob } from "@vercel/blob";
import { prisma } from "../../lib/prisma";

export type DailyMaintenanceResult = {
  cutoff: string;
  deletedRecipes: number;
  deletedShoppingItems: number;
  deletedRecipeImages: number;
};

const RETENTION_DAYS = 30;
const RECIPE_IMAGE_PREFIX = "recipe-images/";

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
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return blobs;
}

async function deleteUnreferencedRecipeImages(
  referencedImageUrls: Set<string>,
  blobClient: RecipeImageBlobClient,
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return 0;
  }

  const blobs = await listRecipeImageBlobs(blobClient);
  const unreferencedUrls = blobs
    .filter((blob) => blob.pathname.startsWith(RECIPE_IMAGE_PREFIX))
    .filter((blob) => !referencedImageUrls.has(blob.url))
    .map((blob) => blob.url);

  if (unreferencedUrls.length === 0) {
    return 0;
  }

  await blobClient.del(unreferencedUrls);

  return unreferencedUrls.length;
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
  const deletedRecipeImages = await deleteUnreferencedRecipeImages(
    dbResult.referencedRecipeImageUrls,
    blobClient,
  );

  return {
    cutoff: dbResult.cutoff,
    deletedRecipes: dbResult.deletedRecipes,
    deletedShoppingItems: dbResult.deletedShoppingItems,
    deletedRecipeImages,
  };
}
