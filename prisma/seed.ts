import { PrismaClient, RecipeCategory } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const recipe = await prisma.recipe.create({
    data: {
      title: "カレー",
      category: RecipeCategory.MAIN,
      steps: {
        create: [
          { content: "野菜を切る", order: 1 },
          { content: "煮込む", order: 2 },
        ],
      },
    },
  })

  console.log("seed done", recipe.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())