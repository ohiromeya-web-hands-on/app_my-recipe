import { RecipeCategory } from "@prisma/client";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata = {
  title: "新しいレシピ | MyKitchen"
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewRecipePage() {
  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="eyebrow">Owner</span>
        <h1>新しいレシピ</h1>
        <p className="lead">作り方までまとめて保存します。</p>
      </section>
      <RecipeForm
        mode="create"
        defaultValues={{
          title: "",
          emoji: "",
          imageUrl: "",
          imageAlt: "",
          category: RecipeCategory.MAIN,
          genres: [],
          mealTypes: [],
          difficulty: 1,
          servings: 2,
          referenceUrl: "",
          memoMarkdown: "",
          savedAt: todayInputValue(),
          isFavorite: false,
          steps: [{ content: "" }],
        }}
      />
    </main>
  );
}
