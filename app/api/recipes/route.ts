import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    where: { deletedAt: null },
    include: {
      steps: {
        orderBy: { order: 'asc' }
      }
    }
  })

  return NextResponse.json(recipes)
}