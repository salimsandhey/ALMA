-- CreateEnum
CREATE TYPE "EntertainmentType" AS ENUM ('VIDEO', 'ARTICLE');

-- CreateTable
CREATE TABLE "EntertainmentContent" (
    "id" TEXT NOT NULL,
    "type" "EntertainmentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 30,
    "orderIndex" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntertainmentContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntertainmentQuestion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "keywords" TEXT[],
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntertainmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntertainmentAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntertainmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntertainmentContent_type_idx" ON "EntertainmentContent"("type");

-- CreateIndex
CREATE INDEX "EntertainmentContent_isPublished_idx" ON "EntertainmentContent"("isPublished");

-- CreateIndex
CREATE INDEX "EntertainmentContent_orderIndex_idx" ON "EntertainmentContent"("orderIndex");

-- CreateIndex
CREATE INDEX "EntertainmentQuestion_contentId_idx" ON "EntertainmentQuestion"("contentId");

-- CreateIndex
CREATE INDEX "EntertainmentAttempt_userId_idx" ON "EntertainmentAttempt"("userId");

-- CreateIndex
CREATE INDEX "EntertainmentAttempt_contentId_idx" ON "EntertainmentAttempt"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "EntertainmentAttempt_userId_contentId_key" ON "EntertainmentAttempt"("userId", "contentId");

-- AddForeignKey
ALTER TABLE "EntertainmentQuestion" ADD CONSTRAINT "EntertainmentQuestion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EntertainmentContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntertainmentAttempt" ADD CONSTRAINT "EntertainmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntertainmentAttempt" ADD CONSTRAINT "EntertainmentAttempt_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EntertainmentContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
