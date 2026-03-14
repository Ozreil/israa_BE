-- CreateTable
CREATE TABLE "MealPlanTemplate" (
    "id" UUID NOT NULL,
    "calories" INTEGER,
    "tags" JSONB NOT NULL,
    "sourceFile" TEXT,
    "planTable" JSONB NOT NULL,
    "notes" TEXT,
    "isNormalized" BOOLEAN NOT NULL DEFAULT false,
    "normalizedTable" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanTemplate_pkey" PRIMARY KEY ("id")
);
