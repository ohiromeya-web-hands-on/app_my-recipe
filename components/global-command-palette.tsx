"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CommandRecipe = {
  id: string;
  title: string;
  emoji: string | null;
  ingredients: string[];
};

export function GlobalCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<CommandRecipe[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }

      // "/" is intentionally not bound globally so browser/page search and form input stay untouched.
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setErrorMessage(null);
        const response = await fetch(`/api/recipes?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          console.error("recipe command search failed", response.status);
          setErrorMessage("検索結果を取得できませんでした。");
          return;
        }

        setRecipes((await response.json()) as CommandRecipe[]);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("recipe command search failed", error);
        setErrorMessage("検索結果を取得できませんでした。");
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Command.Dialog
      label="レシピ検索"
      open={open}
      onOpenChange={setOpen}
      className="command-dialog"
      overlayClassName="command-overlay"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="レシピ名・材料名で検索"
        autoFocus
      />
      <Command.List>
        <Command.Empty>
          {errorMessage ?? "該当するレシピはありません"}
        </Command.Empty>
        <Command.Group heading="レシピ">
          {recipes.map((recipe) => (
            <Command.Item
              key={recipe.id}
              value={`${recipe.title} ${recipe.ingredients.join(" ")}`}
              onSelect={() => {
                setOpen(false);
                router.push(`/recipes/${recipe.id}`);
              }}
            >
              <span>{recipe.emoji || "🍳"}</span>
              <div>
                <strong>{recipe.title}</strong>
                <small>{recipe.ingredients.slice(0, 4).join("、") || "材料未登録"}</small>
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
