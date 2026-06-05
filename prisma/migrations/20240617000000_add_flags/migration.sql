CREATE TABLE "Flag" (
    "id"         TEXT NOT NULL,
    "workId"     TEXT NOT NULL,
    "chapterId"  TEXT NOT NULL,
    "color"      TEXT NOT NULL,
    "fromOffset" INTEGER NOT NULL,
    "toOffset"   INTEGER NOT NULL,
    "snippet"    TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Flag" ADD CONSTRAINT "Flag_workId_fkey"
    FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Flag" ADD CONSTRAINT "Flag_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Flag_workId_idx"    ON "Flag"("workId");
CREATE INDEX "Flag_chapterId_idx" ON "Flag"("chapterId");
