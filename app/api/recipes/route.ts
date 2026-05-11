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

    const body = await req.json().catch(() => null)

  const ALLOWED_CATEGORIES = ['MAIN', 'SIDE', 'SOUP', 'DESSERT', 'OTHER'] as const
  type Category = (typeof ALLOWED_CATEGORIES)[number]
  const isCategory = (v: unknown): v is Category =>
    typeof v === 'string' && (ALLOWED_CATEGORIES as readonly string[]).includes(v)

  if (
    !body ||
    typeof body.title !== 'string' ||
    body.title.trim() === '' ||
    !Array.isArray(body.steps) ||
    body.steps.length === 0 ||
    !body.steps.every((s: unknown) => typeof s === 'string' && s.trim() !== '')
  ) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload' },
      { status: 400 },
    )
  }

  const category: Category = isCategory(body.category) ? body.category : 'MAIN'

  const recipe = await prisma.recipe.create({
    data: {
      title: body.title,
      category,
      steps: {
        create: body.steps.map((step: string, index: number) => ({
          content: step,
          order: index + 1,
        })),
      },
    },
  })

  return NextResponse.json(recipe)