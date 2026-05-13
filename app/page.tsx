import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import {
  listLatestPublishedRecipes,
  listNeededShoppingItems,
} from "@/features/recipes/queries";
import {
  shoppingCategoryLabel,
  shoppingStatusLabel,
} from "@/features/recipes/view-labels";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [recipes, shoppingItems] = await Promise.all([
    listLatestPublishedRecipes(6),
    listNeededShoppingItems(10),
  ]);

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">MyKitchen</span>
          <h1>今日の台所</h1>
          <p className="lead">
            保存したレシピと買い物候補を、実データからすぐ確認できます。
          </p>
        </div>
        <Link className="button" href="/recipes">
          レシピを見る
        </Link>
      </section>

      <div className="dashboard-grid">
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Latest recipes</span>
              <h2>最新レシピ</h2>
            </div>
            <Link href="/recipes">すべて見る</Link>
          </div>

          {recipes.length > 0 ? (
            <div className="recipe-grid compact">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>レシピはまだありません</strong>
              <p>登録されたレシピがここに表示されます。</p>
            </div>
          )}
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Shopping</span>
              <h2>未購入リスト</h2>
            </div>
          </div>

          {shoppingItems.length > 0 ? (
            <ol className="shopping-list">
              {shoppingItems.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {shoppingCategoryLabel(item.category)} /{" "}
                      {shoppingStatusLabel(item.status)}
                    </span>
                  </div>
                  <small>
                    {item.recipeIngredients
                      .slice(0, 2)
                      .map(({ recipe }) => recipe.title)
                      .join("、") || "単独項目"}
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-state">
              <strong>未購入の項目はありません</strong>
              <p>買い物が必要な材料がここに表示されます。</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
