import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // ① カレー
  await prisma.recipe.create({
    data: {
      title: "カレー",
      category: "MAIN",
      steps: {
        create: [
          { content: "野菜を切る", order: 1 },
          { content: "煮込む", order: 2 },
        ],
      },
      ingredients: {
        create: [
          {
            shoppingItem: {
              create: {
                name: "にんじん",
                normalizedName: "にんじん",
                status: "NEED",
                category: "VEGETABLE",
              },
            },
          },
        ],
      },
    },
  })

  // ② パスタ
  await prisma.recipe.create({
    data: {
      title: "パスタ",
      category: "MAIN",
      steps: {
        create: [
          { content: "お湯を沸かす", order: 1 },
          { content: "茹でる", order: 2 },
        ],
      },
      ingredients: {
        create: [
          {
            shoppingItem: {
              create: {
                name: "パスタ",
                normalizedName: "ぱすた",
                status: "NEED",
                category: "OTHER",
              },
            },
          },
        ],
      },
    },
  })

  // ③ サラダ
  await prisma.recipe.create({
    data: {
      title: "サラダ",
      category: "SIDE",
      steps: {
        create: [
          { content: "野菜を切る", order: 1 },
          { content: "盛り付ける", order: 2 },
        ],
      },
      ingredients: {
        create: [
          {
            shoppingItem: {
              create: {
                name: "レタス",
                normalizedName: "れたす",
                status: "NEED",
                category: "VEGETABLE",
              },
            },
          },
        ],
      },
    },
  })

  console.log("seed done")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())