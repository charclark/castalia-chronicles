-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Image_universeId_idx" ON "Image"("universeId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_universeId_fkey"
    FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
