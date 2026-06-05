-- AlterTable
ALTER TABLE "AIUsageLog" ADD COLUMN     "aiModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
ADD COLUMN     "inputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "outputTokens" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");
