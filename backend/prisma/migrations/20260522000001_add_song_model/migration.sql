-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "lyrics" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Song_isPublished_idx" ON "Song"("isPublished");

-- CreateIndex
CREATE INDEX "Song_orderIndex_idx" ON "Song"("orderIndex");
