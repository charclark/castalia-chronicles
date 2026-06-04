-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "characterType" TEXT NOT NULL DEFAULT 'Human',
    "subtype" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "bodyType" TEXT,
    "attitude" TEXT,
    "quirks" TEXT,
    "speakingStyle" TEXT,
    "phrases" TEXT,
    "origin" TEXT,
    "livesIn" TEXT,
    "homeDescription" TEXT,
    "vehicles" TEXT,
    "jobs" TEXT,
    "pets" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterRelationship" (
    "id" TEXT NOT NULL,
    "fromCharacterId" TEXT NOT NULL,
    "toCharacterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Character_universeId_idx" ON "Character"("universeId");
CREATE INDEX "CharacterRelationship_fromCharacterId_idx" ON "CharacterRelationship"("fromCharacterId");
CREATE INDEX "CharacterRelationship_toCharacterId_idx" ON "CharacterRelationship"("toCharacterId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_universeId_fkey"
    FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterRelationship" ADD CONSTRAINT "CharacterRelationship_fromCharacterId_fkey"
    FOREIGN KEY ("fromCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterRelationship" ADD CONSTRAINT "CharacterRelationship_toCharacterId_fkey"
    FOREIGN KEY ("toCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
