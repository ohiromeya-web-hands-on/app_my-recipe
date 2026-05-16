import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { auth, getAllowedOwnerEmails, normalizeOwnerEmail } from "@/auth";
import { RecipeOwnerActions } from "@/components/recipes/recipe-owner-actions";
import { RestoreMissingItemsButton } from "@/components/shopping/restore-missing-items-button";
import { getPublishedRecipeById } from "@/features/recipes/queries";
import {
  categoryLabel,
  difficultyLabel,
  genreLabel,
  mealTypeLabel,
} from "@/features/recipes/view-labels";

export const dynamic = "force-dynamic";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = await getPublishedRecipeById(id);

  if (!recipe) {
    return {
      title: "レシピが見つかりません | MyKitchen",
    };
  }

  return {
    title: `${recipe.title} | MyKitchen`,
    description: `${recipe.title} の材料と作り方です。`,
    openGraph: {
      title: recipe.title,
      description: `${recipe.title} の材料と作り方です。`,
      images: [recipe.imageUrl || "/og-default.png"],
    },
  };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const [recipe, session] = await Promise.all([getPublishedRecipeById(id), auth()]);

  if (!recipe) {
    notFound();
  }

  const isOwner =
    session?.user?.email != null &&
    getAllowedOwnerEmails().has(normalizeOwnerEmail(session.user.email));
  const hasPurchasedIngredient = recipe.ingredients.some(
    (ingredient) => ingredient.shoppingItem.purchased,
  );

  return (
    <main className="page-shell recipe-detail-shell">
      <Link className="back-link" href="/recipes">
        レシピ一覧へ戻る
      </Link>
      {isOwner ? <RecipeOwnerActions recipeId={recipe.id} /> : null}

      <article className="recipe-detail">
        <header className="recipe-detail-header">
          <div>
            <span className="eyebrow">{categoryLabel(recipe.category)}</span>
            <h1>{recipe.title}</h1>
            <div className="detail-meta">
              <span>{difficultyLabel(recipe.difficulty)}</span>
              <span>
                {recipe.servings != null ? `${recipe.servings}人分` : "人数未設定"}
              </span>
              {recipe.isFavorite ? <span>お気に入り</span> : null}
            </div>
          </div>
          <div className="recipe-detail-image" aria-hidden={!recipe.imageUrl}>
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.imageAlt || recipe.title}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 520px"
                className="recipe-thumb-image"
              />
            ) : (
              <span>{recipe.emoji || "🍳"}</span>
            )}
          </div>
        </header>

        <section className="detail-tags" aria-label="レシピ分類">
          {recipe.genres.map((genre) => (
            <span key={genre.id}>{genreLabel(genre.genre)}</span>
          ))}
          {recipe.mealTypes.map((mealType) => (
            <span key={mealType.id}>{mealTypeLabel(mealType.mealType)}</span>
          ))}
        </section>

        <div className="detail-grid">
          <section className="detail-section">
            <div className="detail-section-heading">
              <h2>材料</h2>
              {isOwner ? (
                <RestoreMissingItemsButton
                  recipeId={recipe.id}
                  disabled={!hasPurchasedIngredient}
                />
              ) : null}
            </div>
            {recipe.ingredients.length > 0 ? (
              <ul className="ingredient-list">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    <span>{ingredient.shoppingItem.name}</span>
                    <small>{ingredient.quantity || "分量未設定"}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">材料はまだ登録されていません。</p>
            )}
          </section>

          <section className="detail-section">
            <h2>作り方</h2>
            {recipe.steps.length > 0 ? (
              <ol className="step-list">
                {recipe.steps.map((step) => (
                  <li key={step.id}>{step.content}</li>
                ))}
              </ol>
            ) : (
              <p className="muted-text">手順はまだ登録されていません。</p>
            )}
          </section>
        </div>

        <section className="detail-section">
          <h2>メモ</h2>
          {recipe.memoMarkdown.trim() ? (
            <div className="markdown-body">
              <ReactMarkdown>{recipe.memoMarkdown}</ReactMarkdown>
            </div>
          ) : (
            <p className="muted-text">メモはまだ登録されていません。</p>
          )}
        </section>
      </article>
    </main>
  );
}
