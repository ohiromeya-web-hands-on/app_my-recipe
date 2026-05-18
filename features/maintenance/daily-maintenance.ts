import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type DailyMaintenanceResult = {
  cutoff: string;
  deletedRecipes: number;
  deletedShoppingItems: number;
};

const RETENTION_DAYS = 30;

export function maintenanceCutoff(now = new Date()) {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export async function runDailyMaintenance(
  client: PrismaClient | Prisma.TransactionClient = prisma,
  now = new Date(),
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

    return {
      cutoff: cutoff.toISOString(),
      deletedRecipes: deletedRecipes.count,
      deletedShoppingItems: deletedShoppingItems.count,
    };
  };

  if ("$transaction" in client) {
    return client.$transaction(run);
  }

  return run(client);
}
