import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    where: { deletedAt: null }
    include: {
      ssteps: { orderBy: { order: 'asc' } ,
     },
    },
  })

  return NextResponse.json(recipes)
}

export async function POST(req: Request) {
  const body = await req.json();

  const recipe = await prisma.recipe.create({
    data: {
      title: body.title,
      category: 'MAIN',
      steps: {
        create: body.steps.map((step: string, index: number) => ({
          content: step,
          order: index + 1,
        })),
      },
    },
  });

  return NextResponse.json(recipe);
}