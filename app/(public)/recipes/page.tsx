import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeSearchPanel } from "@/components/recipes/recipe-search-panel";
import { getOptionalOwnerSession } from "@/features/auth/owner-session";
import { listPublishedRecipes } from "@/features/recipes/queries";
import { parseRecipeListSearchParams } from "@/features/recipes/search-params";
import {
  categoryLabel,
  difficultyLabel,
  genreLabel,
  mealTypeLabel,
} from "@/features/recipes/view-labels";

type RecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "レシピ一覧 | MyKitchen",
  description: "MyKitchen に保存した公開レシピの一覧です。",
};

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = parseRecipeListSearchParams(await searchParams);
  const [recipes, ownerSession] = await Promise.all([
    listPublishedRecipes(params),
    getOptionalOwnerSession(),
  ]);
  const isOwner = ownerSession != null;

  return (
    <main className="page-shell">
      <section className="page-header page-header-with-actions">
        <div>
          <span className="eyebrow">Recipes</span>
          <h1>レシピ一覧</h1>
          <p className="lead">検索・フィルター・表示切替の状態は URL で共有できます。</p>
        </div>
        {isOwner ? (
          <Link className="button" href="/recipes/new">
            新規追加
          </Link>
        ) : (
          <Link className="button" href="/api/auth/signin?callbackUrl=%2Frecipes">
            ログイン
          </Link>
        )}
      </section>

      <div className="recipes-layout">
        <RecipeSearchPanel params={params} />

        <section className="recipe-results" aria-live="polite">
          <div className="recipe-results-heading">
            <h2>検索結果</h2>
            <strong>{recipes.length}件</strong>
            <span>
              {params.view === "table" ? "テーブル表示" : "ギャラリー表示"}
              {params.favorite ? " / お気に入りのみ" : ""}
            </span>
          </div>

          {recipes.length > 0 && params.view === "gallery" ? (
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : null}

          {recipes.length > 0 && params.view === "table" ? (
            <div className="recipe-table-wrap">
              <table className="recipe-table">
                <thead>
                  <tr>
                    <th>レシピ</th>
                    <th>カテゴリー</th>
                    <th>難易度</th>
                    <th>ジャンル</th>
                    <th>食事タイプ</th>
                    <th>保存日</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <tr key={recipe.id}>
                      <td>
                        <Link href={`/recipes/${recipe.id}`}>
                          {recipe.emoji ? `${recipe.emoji} ` : ""}
                          {recipe.title}
                        </Link>
                      </td>
                      <td>{categoryLabel(recipe.category)}</td>
                      <td>{difficultyLabel(recipe.difficulty)}</td>
                      <td>
                        {recipe.genres.map((genre) => genreLabel(genre.genre)).join("、") ||
                          "未設定"}
                      </td>
                      <td>
                        {recipe.mealTypes
                          .map((mealType) => mealTypeLabel(mealType.mealType))
                          .join("、") || "未設定"}
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("ja-JP", {
                          dateStyle: "medium",
                          timeZone: "Asia/Tokyo",
                        }).format(recipe.savedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {recipes.length === 0 ? (
            <div className="empty-state large">
              <strong>条件に合うレシピはありません</strong>
              <p>検索語やフィルターを少し広げてみてください。</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
