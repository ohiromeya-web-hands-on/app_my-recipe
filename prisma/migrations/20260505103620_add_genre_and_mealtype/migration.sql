-- CreateTable
CREATE TABLE "RecipeGenre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    CONSTRAINT "RecipeGenre_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeMealType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    CONSTRAINT "RecipeMealType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeGenre_recipeId_genre_key" ON "RecipeGenre"("recipeId", "genre");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeMealType_recipeId_mealType_key" ON "RecipeMealType"("recipeId", "mealType");
