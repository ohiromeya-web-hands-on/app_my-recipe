import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL ?? ''

const isPostgres = databaseUrl.startsWith('postgresql://')

const adapter = isPostgres
  ? new PrismaPg({
      connectionString: databaseUrl,
    })
  : undefined

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    adapter
      ? { adapter }
      : {}
  )
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}