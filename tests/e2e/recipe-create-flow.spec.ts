import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test, type Page } from "@playwright/test";

const runId = Date.now();
let prisma: PrismaClient;
const createdRecipeTitles: string[] = [];

test.beforeAll(async () => {
  if (process.env.PLAYWRIGHT_TEST !== "1") {
    throw new Error("Refusing to run E2E DB writes without PLAYWRIGHT_TEST=1");
  }

  prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
});

test.afterEach(async () => {
  if (createdRecipeTitles.length > 0) {
    await prisma.recipe.deleteMany({
      where: {
        title: {
          in: [...createdRecipeTitles],
        },
      },
    });
    createdRecipeTitles.length = 0;
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function setHiddenInputValue(page: Page, name: string, value: string) {
  await page.locator(`input[name="${name}"]`).evaluate(
    (element, nextValue) => {
      const input = element as HTMLInputElement;
      input.value = nextValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

async function saveRecipe(page: Page, title: string, options: { withImage?: boolean } = {}) {
  await page.goto("/recipes/new");
  await expect(page.getByRole("heading", { name: "新しいレシピ" })).toBeVisible();

  await page.getByLabel("レシピ名").fill(title);
  await page.getByLabel("アイコン").fill("🍳");
  await page.getByLabel("手順 1").fill("材料を混ぜて加熱する");

  if (options.withImage) {
    await setHiddenInputValue(
      page,
      "imageUrl",
      "https://e2e.public.blob.vercel-storage.com/recipe-images/e2e-recipe-image.webp",
    );
    await page.getByLabel("写真の説明").fill("E2E 用の料理写真");
  }

  createdRecipeTitles.push(title);
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page).toHaveURL(/\/recipes\/(?!new$)[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(title)).toBeVisible();

  await page.goto("/recipes");
  await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
}

test("owner can reach the new recipe page from dashboard and recipes list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "新規追加" }).first().click();
  await expect(page).toHaveURL(/\/recipes\/new$/);

  await page.goto("/recipes");
  await page.getByRole("link", { name: "新規追加" }).click();
  await expect(page).toHaveURL(/\/recipes\/new$/);
});

test("owner can create recipes with and without an image", async ({ page }) => {
  await saveRecipe(page, `E2E 画像なしレシピ ${runId}`);
  await saveRecipe(page, `E2E 画像ありレシピ ${runId}`, {
    withImage: true,
  });
});
