import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const recipeInclude = {
  genres: {
    orderBy: { id: "asc" as const },
  },
  mealTypes: {
    orderBy: { id: "asc" as const },
  },
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
    orderBy: { id: "asc" as const },
  },
};

export type RecipeWithRelations = Prisma.RecipeGetPayload<{
  include: typeof recipeInclude;
}>;

export async function listPublishedRecipes(take = 50) {
  return prisma.recipe.findMany({
    where: { deletedAt: null },
    take,
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

export const getPublishedRecipeById = cache(async (id: string) => {
  return prisma.recipe.findFirst({
    where: { id, deletedAt: null },
    include: recipeInclude,
  });
});

export const getEditableRecipeById = cache(async (id: string) => {
  return prisma.recipe.findFirst({
    where: { id, deletedAt: null },
    include: recipeInclude,
  });
});

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
