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

export default async function Home() {
  const session = await auth();
  const { t } = getTranslations();
  const isSignedIn = Boolean(session?.user);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Deploy smoke test</p>
          <h1>{t.appName}</h1>
          <p className="lead">{t.tagline}</p>
        </div>
        <ThemeToggle />
      </section>

      <section className="status-grid" aria-label="環境資材チェック">
        {deploymentChecks.map((item) => (
          <article className="status-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="auth-card" aria-label="認証チェック">
        <div>
          <span className="eyebrow">Auth</span>
          <h2>{isSignedIn ? t.auth.signedIn : t.auth.signedOut}</h2>
          <p>
            {isSignedIn
              ? `signed in as ${session?.user?.email ?? session?.user?.name ?? "owner"}`
              : "Google OAuth credentials are read from the Vercel environment."}
          </p>
        </div>
        <AuthActions isSignedIn={isSignedIn} />
      </section>
    </main>
  );
}
