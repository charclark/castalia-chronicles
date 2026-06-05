-- AddColumn: isSuperAdmin on User
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn: isPrivate on Universe
ALTER TABLE "Universe" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: UniverseAccess
CREATE TABLE "UniverseAccess" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniverseAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniverseAccess_universeId_userId_key" ON "UniverseAccess"("universeId", "userId");
CREATE INDEX "UniverseAccess_universeId_idx" ON "UniverseAccess"("universeId");
CREATE INDEX "UniverseAccess_userId_idx" ON "UniverseAccess"("userId");

-- AddForeignKey
ALTER TABLE "UniverseAccess" ADD CONSTRAINT "UniverseAccess_universeId_fkey"
    FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniverseAccess" ADD CONSTRAINT "UniverseAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
