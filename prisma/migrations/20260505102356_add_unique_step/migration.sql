/*
  Warnings:

  - A unique constraint covering the columns `[recipeId,stepOrder]` on the table `Step` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Step_recipeId_stepOrder_key" ON "Step"("recipeId", "stepOrder");
