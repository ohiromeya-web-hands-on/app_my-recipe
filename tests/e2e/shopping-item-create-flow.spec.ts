import { PrismaClient, ShoppingCategory, ShoppingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test } from "@playwright/test";
import { normalizeShoppingItemName } from "../../lib/normalize";

const runId = Date.now();
let prisma: PrismaClient;
const createdShoppingItemNames: string[] = [];

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
  if (createdShoppingItemNames.length === 0) {
    return;
  }

  await prisma.shoppingItem.deleteMany({
    where: {
      name: {
        in: [...createdShoppingItemNames],
      },
    },
  });
  createdShoppingItemNames.length = 0;
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("owner can add a shopping item from the shopping page", async ({ page }) => {
  const itemName = `E2E 牛乳 ${runId}`;
  createdShoppingItemNames.push(itemName);

  await page.goto("/shopping");
  await page.getByLabel("品名").fill(itemName);
  await page.getByLabel("カテゴリー").selectOption(ShoppingCategory.DAIRY);
  await page.getByLabel("ステータス").selectOption(ShoppingStatus.NEED);
  await page.getByRole("button", { name: "追加する" }).click();

  await expect(page.getByText(`「${itemName}」を買うものに追加しました`)).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: itemName })).toBeVisible();
});

test("duplicate normalized shopping item names are rejected", async ({ page }) => {
  const itemName = `E2E Salt ${runId}`;
  createdShoppingItemNames.push(itemName);

  await prisma.shoppingItem.create({
    data: {
      name: itemName,
      normalizedName: normalizeShoppingItemName(itemName),
      category: ShoppingCategory.SEASONING,
      status: ShoppingStatus.NEED,
    },
  });

  await page.goto("/shopping");
  await page.getByLabel("品名").fill(itemName.toUpperCase());
  await page.getByLabel("カテゴリー").selectOption(ShoppingCategory.SEASONING);
  await page.getByLabel("ステータス").selectOption(ShoppingStatus.NEED);
  await page.getByRole("button", { name: "追加する" }).click();

  await expect(page.getByText(`「${itemName.toUpperCase()}」は既に買い物リストにあります`)).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: itemName }),
  ).toHaveCount(1);
});
