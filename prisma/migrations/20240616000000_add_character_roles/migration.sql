-- CreateTable: CharacterRole
CREATE TABLE "CharacterRole" (
    "characterId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "CharacterRole_pkey" PRIMARY KEY ("characterId","role")
);
CREATE INDEX "CharacterRole_characterId_idx" ON "CharacterRole"("characterId");
ALTER TABLE "CharacterRole" ADD CONSTRAINT "CharacterRole_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CustomRole
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomRole_universeId_name_key" ON "CustomRole"("universeId", "name");
CREATE INDEX "CustomRole_universeId_idx" ON "CustomRole"("universeId");
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_universeId_fkey"
    FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
