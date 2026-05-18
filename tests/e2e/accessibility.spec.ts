import { AxeBuilder } from "@axe-core/playwright";
import { PrismaClient, RecipeCategory, ShoppingCategory, ShoppingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test } from "@playwright/test";

const normalizedName = `e2e tomato ${Date.now()}`;
let prisma: PrismaClient;
let recipeId: string;
let shoppingItemId: string;

test.beforeAll(async () => {
  if (process.env.PLAYWRIGHT_TEST !== "1") {
    throw new Error("Refusing to run E2E DB writes without PLAYWRIGHT_TEST=1");
  }

  prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });

  const shoppingItem = await prisma.shoppingItem.create({
    data: {
      name: "E2E トマト",
      normalizedName,
      status: ShoppingStatus.NEED,
      category: ShoppingCategory.VEGETABLE,
    },
  });
  const recipe = await prisma.recipe.create({
    data: {
      title: "E2E トマトスープ",
      emoji: "🍅",
      category: RecipeCategory.SOUP,
      difficulty: 1,
      memoMarkdown: "Playwright accessibility smoke recipe",
      steps: {
        create: [{ content: "温める", order: 1 }],
      },
      ingredients: {
        create: [
          {
            shoppingItemId: shoppingItem.id,
            quantity: "1個",
          },
        ],
      },
    },
  });

  recipeId = recipe.id;
  shoppingItemId = shoppingItem.id;
});

test.afterAll(async () => {
  if (!prisma) {
    return;
  }

  await prisma.recipe.deleteMany({ where: { id: recipeId } });
  await prisma.shoppingItem.deleteMany({ where: { id: shoppingItemId } });
  await prisma.$disconnect();
});

for (const path of ["/", "/recipes", () => `/recipes/${recipeId}`, "/shopping"]) {
  test(`has no axe violations on ${typeof path === "string" ? path : "/recipes/[id]"}`, async ({
    page,
  }) => {
    const url = typeof path === "string" ? path : path();
    await page.goto(url);
    await expect(page.locator("main")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
