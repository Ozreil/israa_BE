CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "calories" INTEGER,
    "tags" JSONB NOT NULL,
    "sourceFile" TEXT,
    "days" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
