-- CreateEnum
CREATE TYPE "RecipeGenreValue" AS ENUM ('WASHOKU', 'YOSHOKU', 'CHINESE');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('MAIN', 'SIDE', 'SOUP', 'DESSERT', 'OTHER');

-- CreateEnum
CREATE TYPE "ShoppingStatus" AS ENUM ('NEED', 'STOCK', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "ShoppingCategory" AS ENUM ('VEGETABLE', 'MEAT', 'FISH', 'DAIRY', 'SEASONING', 'OTHER');

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "RecipeCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "status" "ShoppingStatus" NOT NULL,
    "category" "ShoppingCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "shoppingItemId" TEXT NOT NULL,
    "quantity" TEXT,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeGenre" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "genre" "RecipeGenreValue" NOT NULL,

    CONSTRAINT "RecipeGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeMealType" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,

    CONSTRAINT "RecipeMealType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Step_recipeId_order_key" ON "Step"("recipeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingItem_normalizedName_key" ON "ShoppingItem"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeGenre_recipeId_genre_key" ON "RecipeGenre"("recipeId", "genre");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeMealType_recipeId_mealType_key" ON "RecipeMealType"("recipeId", "mealType");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_shoppingItemId_fkey" FOREIGN KEY ("shoppingItemId") REFERENCES "ShoppingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeGenre" ADD CONSTRAINT "RecipeGenre_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeMealType" ADD CONSTRAINT "RecipeMealType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
