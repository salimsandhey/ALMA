-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "sampleAnswer" TEXT NOT NULL,
    "keywords" TEXT[],
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "challengeDate" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "spokenText" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_orderIndex_key" ON "DailyChallenge"("orderIndex");

-- CreateIndex
CREATE INDEX "DailyChallenge_isActive_idx" ON "DailyChallenge"("isActive");

-- CreateIndex
CREATE INDEX "DailyChallenge_orderIndex_idx" ON "DailyChallenge"("orderIndex");

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_userId_idx" ON "DailyChallengeAttempt"("userId");

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_challengeDate_idx" ON "DailyChallengeAttempt"("challengeDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeAttempt_userId_challengeDate_key" ON "DailyChallengeAttempt"("userId", "challengeDate");

-- AddForeignKey
ALTER TABLE "DailyChallengeAttempt" ADD CONSTRAINT "DailyChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeAttempt" ADD CONSTRAINT "DailyChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
