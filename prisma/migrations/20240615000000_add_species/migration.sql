CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Species_universeId_name_key" ON "Species"("universeId", "name");
CREATE INDEX "Species_universeId_idx" ON "Species"("universeId");
ALTER TABLE "Species" ADD CONSTRAINT "Species_universeId_fkey"
    FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
