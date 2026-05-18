import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { RecipeListParams } from "@/features/recipes/search-params";

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

function recipeSearchWhere(params?: RecipeListParams): Prisma.RecipeWhereInput {
  const and: Prisma.RecipeWhereInput[] = [{ deletedAt: null }];
  const query = params?.q.trim();

  if (query) {
    and.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { memoMarkdown: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (params?.category) {
    and.push({ category: params.category });
  }

  for (const genre of params?.genres ?? []) {
    and.push({
      genres: {
        some: { genre },
      },
    });
  }

  for (const mealType of params?.mealTypes ?? []) {
    and.push({
      mealTypes: {
        some: { mealType },
      },
    });
  }

  if (params?.difficultyMin != null || params?.difficultyMax != null) {
    and.push({
      difficulty: {
        gte: params.difficultyMin,
        lte: params.difficultyMax,
      },
    });
  }

  if (params?.favorite) {
    and.push({ isFavorite: true });
  }

  return { AND: and };
}

function recipeOrderBy(params?: RecipeListParams): Prisma.RecipeOrderByWithRelationInput[] {
  const sort = params?.sort ?? "savedAt";
  const order = params?.order ?? "desc";

  return [{ [sort]: order }, { createdAt: "desc" }];
}

export async function listPublishedRecipes(params?: RecipeListParams, take = 50) {
  return prisma.recipe.findMany({
    where: recipeSearchWhere(params),
    take,
    orderBy: recipeOrderBy(params),
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

export async function listRecipeCommandItems(query: string, take = 8) {
  const normalizedQuery = query.trim();

  return prisma.recipe.findMany({
    where: {
      deletedAt: null,
      ...(normalizedQuery
        ? {
            OR: [
              { title: { contains: normalizedQuery, mode: "insensitive" as const } },
              { memoMarkdown: { contains: normalizedQuery, mode: "insensitive" as const } },
              {
                ingredients: {
                  some: {
                    shoppingItem: {
                      deletedAt: null,
                      name: { contains: normalizedQuery, mode: "insensitive" as const },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    take,
    orderBy: [{ savedAt: "desc" }, { createdAt: "desc" }],
    include: {
      ingredients: {
        where: {
          shoppingItem: {
            deletedAt: null,
          },
        },
        include: {
          shoppingItem: true,
        },
        orderBy: { id: "asc" },
      },
    },
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
