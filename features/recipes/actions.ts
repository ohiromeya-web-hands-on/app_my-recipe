"use server";

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
} from "@/features/recipes/schema";

type RecipeActionData = {
  id: string;
  updatedAt: string;
};

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

function mapSteps(steps: { content: string }[]) {
  return steps.map((step, index) => ({
    content: step.content,
    order: (index + 1) * 10,
  }));
}

async function getLatestRecipeSnapshot(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      genres: { orderBy: { id: "asc" } },
      mealTypes: { orderBy: { id: "asc" } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!recipe) {
    return null;
  }

  return {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    memoMarkdown: recipe.memoMarkdown,
    updatedAt: recipe.updatedAt.toISOString(),
    genres: recipe.genres.map((genre) => genre.genre),
    mealTypes: recipe.mealTypes.map((mealType) => mealType.mealType),
    steps: recipe.steps.map((step) => step.content),
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
    const recipe = await prisma.recipe.create({
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

    revalidatePath("/");
    revalidatePath("/recipes");

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
      const result = await tx.recipe.updateMany({
        where: { id, deletedAt: { not: null } },
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
