-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'private',
    "coverImageId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Work_universeId_idx" ON "Work"("universeId");

-- CreateIndex
CREATE INDEX "Work_coverImageId_idx" ON "Work"("coverImageId");

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_universeId_fkey"
    FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_coverImageId_fkey"
    FOREIGN KEY ("coverImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
