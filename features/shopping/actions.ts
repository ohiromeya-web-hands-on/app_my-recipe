"use server";

import { ShoppingStatus, type ShoppingCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ApiResult } from "@/lib/result";
import {
  isOwnerAuthError,
  ownerAuthErrorResult,
  requireOwner,
} from "@/features/auth/require-owner";
import { normalizeShoppingItemName } from "@/lib/normalize";

export type ShoppingItemCandidate = {
  id: string;
  name: string;
  normalizedName: string;
  category: ShoppingCategory;
};

export type ShoppingItemState = {
  id: string;
  purchased: boolean;
  status: ShoppingStatus;
};

export type ShoppingItemActionData = ShoppingItemState & {
  name: string;
  category: ShoppingCategory;
};

function notFoundError(message = "買い物項目が見つかりません"): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message,
    },
  };
}

function internalError(message = "買い物リストの更新中にエラーが発生しました"): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message,
    },
  };
}

export async function searchShoppingItem(
  query: string,
): Promise<ApiResult<ShoppingItemCandidate[]>> {
  try {
    await requireOwner();

    const normalizedQuery = normalizeShoppingItemName(query);
    if (!normalizedQuery) {
      return { ok: true, data: [] };
    }

    const items = await prisma.shoppingItem.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            name: {
              contains: query.trim(),
              mode: "insensitive",
            },
          },
          {
            normalizedName: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        name: true,
        normalizedName: true,
        category: true,
      },
    });

    return { ok: true, data: items };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    console.error("searchShoppingItem failed", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "材料候補の検索中にエラーが発生しました",
      },
    };
  }
}

export async function togglePurchased(
  id: string,
  purchased: boolean,
): Promise<ApiResult<ShoppingItemActionData>> {
  try {
    await requireOwner();

    const item = await prisma.shoppingItem.update({
      where: { id, deletedAt: null },
      data: { purchased },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        purchased: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/shopping");
    return { ok: true, data: item };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return notFoundError();
    }

    console.error("togglePurchased failed", error);
    return internalError();
  }
}

export async function restoreMissingItems(
  recipeId: string,
): Promise<ApiResult<{ count: number; previousItems: ShoppingItemState[] }>> {
  try {
    await requireOwner();

    const result = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.findFirst({
        where: { id: recipeId, deletedAt: null },
        select: { id: true },
      });

      if (!recipe) {
        return null;
      }

      const previousItems = await tx.shoppingItem.findMany({
        where: {
          deletedAt: null,
          purchased: true,
          recipeIngredients: {
            some: {
              recipeId,
              recipe: {
                deletedAt: null,
              },
            },
          },
        },
        select: {
          id: true,
          purchased: true,
          status: true,
        },
      });

      if (previousItems.length === 0) {
        return { count: 0, previousItems };
      }

      await tx.shoppingItem.updateMany({
        where: {
          id: {
            in: previousItems.map((item) => item.id),
          },
        },
        data: {
          purchased: false,
          status: ShoppingStatus.NEED,
        },
      });

      return { count: previousItems.length, previousItems };
    });

    if (!result) {
      return notFoundError("レシピが見つかりません");
    }

    revalidatePath("/");
    revalidatePath("/shopping");
    revalidatePath(`/recipes/${recipeId}`);
    return { ok: true, data: result };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    console.error("restoreMissingItems failed", error);
    return internalError("不足材料を買い物リストに戻せませんでした");
  }
}

export async function restoreShoppingItemStates(
  states: ShoppingItemState[],
): Promise<ApiResult<{ count: number }>> {
  try {
    await requireOwner();

    const result = await prisma.$transaction(async (tx) => {
      for (const state of states) {
        await tx.shoppingItem.update({
          where: { id: state.id, deletedAt: null },
          data: {
            purchased: state.purchased,
            status: state.status,
          },
        });
      }

      return { count: states.length };
    });

    revalidatePath("/");
    revalidatePath("/shopping");
    return { ok: true, data: result };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    console.error("restoreShoppingItemStates failed", error);
    return internalError("Undo に失敗しました");
  }
}
