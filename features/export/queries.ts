import { prisma } from "@/lib/prisma";

function toIso(value: Date | null) {
  return value?.toISOString() ?? null;
}

export async function buildExportPayload(now = new Date()) {
  const [recipes, shoppingItems] = await Promise.all([
    prisma.recipe.findMany({
      where: { deletedAt: null },
      orderBy: [{ savedAt: "desc" }, { createdAt: "desc" }],
      include: {
        genres: { orderBy: { id: "asc" } },
        mealTypes: { orderBy: { id: "asc" } },
        steps: { orderBy: { order: "asc" } },
        ingredients: {
          include: {
            shoppingItem: true,
          },
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.shoppingItem.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      include: {
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
          orderBy: { id: "asc" },
        },
      },
    }),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: now.toISOString(),
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      emoji: recipe.emoji,
      imageUrl: recipe.imageUrl,
      imageAlt: recipe.imageAlt,
      category: recipe.category,
      difficulty: recipe.difficulty,
      isFavorite: recipe.isFavorite,
      referenceUrl: recipe.referenceUrl,
      servings: recipe.servings,
      memoMarkdown: recipe.memoMarkdown,
      savedAt: recipe.savedAt.toISOString(),
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      genres: recipe.genres.map(({ genre }) => genre),
      mealTypes: recipe.mealTypes.map(({ mealType }) => mealType),
      steps: recipe.steps.map((step) => ({
        id: step.id,
        content: step.content,
        order: step.order,
      })),
      ingredients: recipe.ingredients.map((ingredient) => ({
        id: ingredient.id,
        shoppingItemId: ingredient.shoppingItemId,
        name: ingredient.shoppingItem.name,
        category: ingredient.shoppingItem.category,
        quantity: ingredient.quantity,
      })),
    })),
    shoppingItems: shoppingItems.map((item) => ({
      id: item.id,
      name: item.name,
      normalizedName: item.normalizedName,
      status: item.status,
      category: item.category,
      purchased: item.purchased,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      deletedAt: toIso(item.deletedAt),
      recipes: item.recipeIngredients.map(({ recipe }) => ({
        id: recipe.id,
        title: recipe.title,
      })),
    })),
    imageUrls: recipes
      .map((recipe) => recipe.imageUrl)
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
  };
}
