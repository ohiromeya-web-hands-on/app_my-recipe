import { RecipeCard } from "@/components/recipe-card";
import { listPublishedRecipes } from "@/features/recipes/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "レシピ一覧 | MyKitchen",
  description: "MyKitchen に保存した公開レシピの一覧です。",
};

export default async function RecipesPage() {
  const recipes = await listPublishedRecipes();

  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="eyebrow">Recipes</span>
        <h1>レシピ一覧</h1>
        <p className="lead">保存日が新しい順にレシピを表示しています。</p>
      </section>

      {recipes.length > 0 ? (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="empty-state large">
          <strong>レシピはまだありません</strong>
          <p>公開できるレシピが登録されると、このページに表示されます。</p>
        </div>
      )}
    </main>
  );
}
