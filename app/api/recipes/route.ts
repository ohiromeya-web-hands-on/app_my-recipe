import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    where: { deletedAt: null },
    include: {
      steps: {
        orderBy: { order: 'asc' },
      },
    },
  })

  return NextResponse.json(recipes)
}

export async function POST(req: Request) {
    const session = await auth()
  const email = session?.user?.email?.toLowerCase()

  const allowedOwnerEmails = new Set(
    (process.env.OWNER_GOOGLE_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )

  if (!email || !allowedOwnerEmails.has(email)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()

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