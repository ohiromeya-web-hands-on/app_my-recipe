import Image from "next/image";
import Link from "next/link";
import type { RecipeWithRelations } from "@/features/recipes/queries";
import {
  categoryLabel,
  difficultyLabel,
  genreLabel,
  mealTypeLabel,
} from "@/features/recipes/view-labels";

type RecipeCardProps = {
  recipe: RecipeWithRelations;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <Link href={`/recipes/${recipe.id}`} className="recipe-card-link">
        <div className="recipe-thumb" aria-hidden={!recipe.imageUrl}>
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.imageAlt || recipe.title}
              fill
              sizes="(max-width: 700px) 100vw, 33vw"
              className="recipe-thumb-image"
            />
          ) : (
            <span>{recipe.emoji || "🍳"}</span>
          )}
        </div>
        <div className="recipe-card-body">
          <div className="meta-row">
            <span>{categoryLabel(recipe.category)}</span>
            <span>{difficultyLabel(recipe.difficulty)}</span>
          </div>
          <h3>{recipe.title}</h3>
          <div className="tag-row">
            {recipe.genres.slice(0, 3).map((genre) => (
              <span key={genre.id}>{genreLabel(genre.genre)}</span>
            ))}
            {recipe.mealTypes.slice(0, 2).map((mealType) => (
              <span key={mealType.id}>{mealTypeLabel(mealType.mealType)}</span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
