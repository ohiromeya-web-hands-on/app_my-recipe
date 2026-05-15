import { RecipeCategory } from "@prisma/client";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata = {
  title: "新しいレシピ | MyKitchen"
};

function todayInputValue() {
  return dateInputValue(new Date());
}

function dateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
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
