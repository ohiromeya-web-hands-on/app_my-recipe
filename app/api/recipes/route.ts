import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listRecipeCommandItems } from '@/features/recipes/queries'
import {
  isOwnerAuthError,
  ownerAuthErrorResult,
  requireOwner,
} from '@/features/auth/require-owner'

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams
  const query = searchParams.get('q')

  // q is used by the command palette and returns a compact search result shape.
  if (query != null) {
    const recipes = await listRecipeCommandItems(query)

    return NextResponse.json(
      recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        emoji: recipe.emoji,
        ingredients: recipe.ingredients.map(({ shoppingItem }) => shoppingItem.name),
      })),
    )
  }

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
  try {
    await requireOwner()
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return NextResponse.json(ownerAuthErrorResult(error), {
        status: error.status,
      })
    }

    throw error
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
}
