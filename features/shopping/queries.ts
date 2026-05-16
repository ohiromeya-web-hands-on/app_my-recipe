import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ShoppingTab = "active" | "purchased";

const shoppingItemInclude = {
  recipeIngredients: {
    where: {
      recipe: {
        deletedAt: null,
      },
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

export type ShoppingItemWithRecipes = Prisma.ShoppingItemGetPayload<{
  include: typeof shoppingItemInclude;
}>;

export function parseShoppingTab(tab: string | string[] | undefined): ShoppingTab {
  return tab === "purchased" ? "purchased" : "active";
}

export async function listShoppingItems(tab: ShoppingTab) {
  return prisma.shoppingItem.findMany({
    where: {
      deletedAt: null,
      purchased: tab === "purchased",
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: shoppingItemInclude,
  });
}

export async function getShoppingTabCounts() {
  const [active, purchased] = await Promise.all([
    prisma.shoppingItem.count({
      where: { deletedAt: null, purchased: false },
    }),
    prisma.shoppingItem.count({
      where: { deletedAt: null, purchased: true },
    }),
  ]);

  return { active, purchased };
}
