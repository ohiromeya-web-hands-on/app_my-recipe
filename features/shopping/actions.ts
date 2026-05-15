"use server";

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
  category: string;
};

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
