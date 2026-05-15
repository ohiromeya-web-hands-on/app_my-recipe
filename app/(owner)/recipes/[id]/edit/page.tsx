import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { dateInputValue } from "@/features/recipes/date";
import { getEditableRecipeById } from "@/features/recipes/queries";

type EditRecipePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditRecipePageProps) {
  const { id } = await params;
  const recipe = await getEditableRecipeById(id);

  return {
    title: recipe ? `${recipe.title}を編集 | MyKitchen` : "レシピ編集 | MyKitchen"
  };
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const recipe = await getEditableRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="eyebrow">Owner</span>
        <h1>レシピ編集</h1>
        <p className="lead">{recipe.title}</p>
      </section>
      <RecipeForm
        mode="edit"
        defaultValues={{
          id: recipe.id,
          updatedAt: recipe.updatedAt.toISOString(),
          title: recipe.title,
          emoji: recipe.emoji ?? "",
          imageUrl: recipe.imageUrl ?? "",
          imageAlt: recipe.imageAlt ?? "",
          category: recipe.category,
          genres: recipe.genres.map((genre) => genre.genre),
          mealTypes: recipe.mealTypes.map((mealType) => mealType.mealType),
          difficulty: recipe.difficulty,
          servings: recipe.servings,
          referenceUrl: recipe.referenceUrl ?? "",
          memoMarkdown: recipe.memoMarkdown,
          savedAt: dateInputValue(recipe.savedAt),
          isFavorite: recipe.isFavorite,
          steps:
            recipe.steps.length > 0
              ? recipe.steps.map((step) => ({ content: step.content }))
              : [{ content: "" }],
          ingredients: recipe.ingredients.map((ingredient) => ({
            shoppingItemId: ingredient.shoppingItem.id,
            name: ingredient.shoppingItem.name,
            amountMemo: ingredient.quantity ?? "",
            category: ingredient.shoppingItem.category,
          })),
        }}
      />
    </main>
  );
}
