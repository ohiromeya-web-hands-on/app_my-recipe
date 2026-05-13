import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const recipeInclude = {
  genres: true,
  mealTypes: true,
  steps: {
    orderBy: { order: "asc" as const },
  },
  ingredients: {
    where: {
      shoppingItem: {
        deletedAt: null,
      },
    },
    include: {
      shoppingItem: true,
    },
  },
};

export type RecipeWithRelations = Prisma.RecipeGetPayload<{
  include: typeof recipeInclude;
}>;

export async function listPublishedRecipes() {
  return prisma.recipe.findMany({
    where: { deletedAt: null },
    orderBy: [{ savedAt: "desc" }, { createdAt: "desc" }],
    include: recipeInclude,
  });
}

export async function listLatestPublishedRecipes(take = 6) {
  return prisma.recipe.findMany({
    where: { deletedAt: null },
    take,
    orderBy: [{ savedAt: "desc" }, { createdAt: "desc" }],
    include: recipeInclude,
  });
}

export async function getPublishedRecipeById(id: string) {
  return prisma.recipe.findFirst({
    where: { id, deletedAt: null },
    include: recipeInclude,
  });
}

export async function listNeededShoppingItems(take = 10) {
  return prisma.shoppingItem.findMany({
    where: {
      deletedAt: null,
      purchased: false,
    },
    take,
    orderBy: { createdAt: "desc" },
    include: {
      recipeIngredients: {
        where: {
          recipe: {
            deletedAt: null,
          },
        },
        include: {
          recipe: true,
        },
      },
    },
  });
}
