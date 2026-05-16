"use server";

import type { Prisma } from "@prisma/client";
import { ShoppingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ApiResult } from "@/lib/result";
import {
  isOwnerAuthError,
  ownerAuthErrorResult,
  requireOwner,
} from "@/features/auth/require-owner";
import {
  recipeFormSchema,
  recipeUpdateSchema,
  type RecipeFormInput,
  type RecipeUpdateInput,
  type RecipeFormValues,
} from "@/features/recipes/schema";
import { normalizeShoppingItemName } from "@/lib/normalize";

type RecipeActionData = {
  id: string;
  updatedAt: string;
};

const RESTORE_WINDOW_MS = 5 * 60 * 1000;

class IngredientConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngredientConflictError";
  }
}

function validationError(details: unknown): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "入力内容を確認してください",
      details,
    },
  };
}

function internalError(): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message: "処理中にエラーが発生しました",
    },
  };
}

function notFoundError(message = "レシピが見つかりません"): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message,
    },
  };
}

function conflictError(message: string): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "CONFLICT",
      message,
    },
  };
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002",
  );
}

function mapSteps(steps: { content: string }[]) {
  return steps.map((step, index) => ({
    content: step.content,
    order: (index + 1) * 10,
  }));
}

async function createRecipeIngredients(
  tx: Prisma.TransactionClient,
  recipeId: string,
  ingredients: RecipeFormValues["ingredients"],
) {
  for (const ingredient of ingredients) {
    const amountMemo = ingredient.amountMemo?.trim() || null;
    let shoppingItemId = ingredient.shoppingItemId;

    if (!shoppingItemId) {
      const name = ingredient.name?.trim() ?? "";
      const normalizedName = normalizeShoppingItemName(name);
      const existing = await tx.shoppingItem.findUnique({
        where: { normalizedName },
        select: { id: true },
      });

      if (existing) {
        throw new IngredientConflictError(
          `「${name}」は既に買い物リストにあります。候補から選択してください。`,
        );
      }

      const shoppingItem = await tx.shoppingItem.create({
        data: {
          name,
          normalizedName,
          status: ShoppingStatus.NEED,
          category: ingredient.category,
        },
        select: { id: true },
      });
      shoppingItemId = shoppingItem.id;
    }

    await tx.recipeIngredient.create({
      data: {
        recipeId,
        shoppingItemId,
        quantity: amountMemo,
      },
    });
  }

}

async function getLatestRecipeSnapshot(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      title: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    return null;
  }

  return {
    title: recipe.title,
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

export async function createRecipe(input: RecipeFormInput): Promise<ApiResult<RecipeActionData>> {
  try {
    await requireOwner();

    const parsed = recipeFormSchema.safeParse(input);
    if (!parsed.success) {
      return validationError(parsed.error.flatten());
    }

    const values = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          title: values.title,
          emoji: values.emoji,
          imageUrl: values.imageUrl,
          imageAlt: values.imageAlt,
          category: values.category,
          difficulty: values.difficulty,
          isFavorite: values.isFavorite,
          referenceUrl: values.referenceUrl,
          servings: values.servings ?? null,
          memoMarkdown: values.memoMarkdown,
          savedAt: values.savedAt,
          genres: {
            create: values.genres.map((genre) => ({ genre })),
          },
          mealTypes: {
            create: values.mealTypes.map((mealType) => ({ mealType })),
          },
          steps: {
            create: mapSteps(values.steps),
          },
        },
        select: {
          id: true,
          updatedAt: true,
        },
      });

      await createRecipeIngredients(
        tx,
        recipe.id,
        values.ingredients,
      );

      return { status: "created" as const, recipe };
    });

    revalidatePath("/");
    revalidatePath("/recipes");

    return {
      ok: true,
      data: {
        id: result.recipe.id,
        updatedAt: result.recipe.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    if (error instanceof IngredientConflictError) {
      return conflictError(error.message);
    }

    if (isUniqueConstraintError(error)) {
      return conflictError("同じ名前の材料が既にあります。候補から選択してください。");
    }

    console.error("createRecipe failed", error);
    return internalError();
  }
}

export async function updateRecipe(
  input: RecipeUpdateInput,
): Promise<ApiResult<RecipeActionData>> {
  try {
    await requireOwner();

    const parsed = recipeUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return validationError(parsed.error.flatten());
    }

    const values = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.recipe.findFirst({
        where: { id: values.id, deletedAt: null },
        select: { updatedAt: true },
      });

      if (!current) {
        return { status: "not-found" as const };
      }

      if (current.updatedAt.getTime() !== values.updatedAt.getTime()) {
        return { status: "conflict" as const };
      }

      await tx.recipeGenre.deleteMany({ where: { recipeId: values.id } });
      await tx.recipeMealType.deleteMany({ where: { recipeId: values.id } });
      await tx.step.deleteMany({ where: { recipeId: values.id } });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: values.id } });

      const recipe = await tx.recipe.update({
        where: { id: values.id },
        data: {
          title: values.title,
          emoji: values.emoji,
          imageUrl: values.imageUrl,
          imageAlt: values.imageAlt,
          category: values.category,
          difficulty: values.difficulty,
          isFavorite: values.isFavorite,
          referenceUrl: values.referenceUrl,
          servings: values.servings ?? null,
          memoMarkdown: values.memoMarkdown,
          savedAt: values.savedAt,
          genres: {
            create: values.genres.map((genre) => ({ genre })),
          },
          mealTypes: {
            create: values.mealTypes.map((mealType) => ({ mealType })),
          },
          steps: {
            create: mapSteps(values.steps),
          },
        },
        select: {
          id: true,
          updatedAt: true,
        },
      });

      await createRecipeIngredients(
        tx,
        values.id,
        values.ingredients,
      );

      return { status: "updated" as const, recipe };
    });

    if (result.status === "not-found") {
      return notFoundError();
    }

    if (result.status === "conflict") {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "他の画面でレシピが更新されています",
          details: {
            latest: await getLatestRecipeSnapshot(values.id),
          },
        },
      };
    }

    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${result.recipe.id}`);
    revalidatePath(`/recipes/${result.recipe.id}/edit`);

    return {
      ok: true,
      data: {
        id: result.recipe.id,
        updatedAt: result.recipe.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    if (error instanceof IngredientConflictError) {
      return conflictError(error.message);
    }

    if (isUniqueConstraintError(error)) {
      return conflictError("同じ名前の材料が既にあります。候補から選択してください。");
    }

    console.error("updateRecipe failed", error);
    return internalError();
  }
}

export async function softDeleteRecipe(id: string): Promise<ApiResult<RecipeActionData>> {
  try {
    await requireOwner();

    const recipe = await prisma.$transaction(async (tx) => {
      const result = await tx.recipe.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (result.count === 0) {
        return null;
      }

      return tx.recipe.findUnique({
        where: { id },
        select: { id: true, updatedAt: true },
      });
    });

    if (!recipe) {
      return notFoundError();
    }

    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);

    return {
      ok: true,
      data: {
        id: recipe.id,
        updatedAt: recipe.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    console.error("softDeleteRecipe failed", error);
    return internalError();
  }
}

export async function restoreRecipe(id: string): Promise<ApiResult<RecipeActionData>> {
  try {
    await requireOwner();

    const recipe = await prisma.$transaction(async (tx) => {
      const restorableSince = new Date(Date.now() - RESTORE_WINDOW_MS);
      const result = await tx.recipe.updateMany({
        where: { id, deletedAt: { gte: restorableSince } },
        data: { deletedAt: null },
      });

      if (result.count === 0) {
        return null;
      }

      return tx.recipe.findUnique({
        where: { id },
        select: { id: true, updatedAt: true },
      });
    });

    if (!recipe) {
      return notFoundError();
    }

    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);

    return {
      ok: true,
      data: {
        id: recipe.id,
        updatedAt: recipe.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return ownerAuthErrorResult(error);
    }

    console.error("restoreRecipe failed", error);
    return internalError();
  }
}
