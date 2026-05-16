import "dotenv/config";
import { PrismaClient, ShoppingCategory, ShoppingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, test } from "vitest";
import { normalizeShoppingItemName } from "../lib/normalize";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const prisma = runDbTests
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    })
  : null;

describe.skipIf(!runDbTests)("ShoppingItem normalizedName unique constraint", () => {
  const normalizedName = normalizeShoppingItemName(`Salt ${Date.now()}`);

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    await prisma.$disconnect();
  });

  test("rejects creating the same normalized name twice", async (context) => {
    if (!prisma) {
      throw new Error("Prisma client is not initialized");
    }

    try {
      await prisma.shoppingItem.deleteMany({ where: { normalizedName } });
    } catch {
      context.skip();
    }

    await prisma.shoppingItem.create({
      data: {
        name: "Salt",
        normalizedName,
        status: ShoppingStatus.NEED,
        category: ShoppingCategory.SEASONING,
      },
    });

    await expect(
      prisma.shoppingItem.create({
        data: {
          name: "ＳＡＬＴ",
          normalizedName,
          status: ShoppingStatus.NEED,
          category: ShoppingCategory.SEASONING,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    await prisma.shoppingItem.deleteMany({ where: { normalizedName } });
  });
});
