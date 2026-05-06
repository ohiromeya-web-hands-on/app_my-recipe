import { auth } from "@/auth";
import { AuthActions } from "@/components/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTranslations } from "@/lib/i18n";

const deploymentChecks = [
  {
    label: "Language",
    value: "TypeScript",
    note: "strict mode enabled"
  },
  {
    label: "Framework",
    value: "Next.js App Router",
    note: "server component page"
  },
  {
    label: "Authentication",
    value: "Auth.js Google OAuth",
    note: "JWT session / owner gate ready"
  },
  {
    label: "Theme",
    value: "next-themes",
    note: "light / dark / system"
  },
  {
    label: "Locale",
    value: "locales/ja.json",
    note: "Japanese copy loaded"
  }
];


async function getRecipes() {
  const res = await fetch('http://localhost:3000/api/recipes', {
    cache: 'no-store',
  });
  return res.json();
}

export default async function Page() {
  const recipes = await getRecipes();

  return (
  <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
  レシピ一覧
</h1>

    {recipes.map((recipe: any) => (
  <div
    key={recipe.id}
    style={{
      marginBottom: '24px',
      padding: '16px',
      border: '1px solid #ccc',
      borderRadius: '8px',
    }}
  >
    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
      {recipe.title}
    </h2>

    <ul style={{ paddingLeft: '20px' }}>
      {recipe.steps.map((step: any) => (
        <li key={step.id}>{step.content}</li>
      ))}
    </ul>
  </div>
    ))}
  </main>
);
}