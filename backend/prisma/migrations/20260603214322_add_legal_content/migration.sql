-- CreateTable
CREATE TABLE "LegalContent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "LegalContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalContent_type_key" ON "LegalContent"("type");
