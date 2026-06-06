-- CreateTable
CREATE TABLE "WorkShare" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkShare_workId_userId_key" ON "WorkShare"("workId", "userId");
CREATE INDEX "WorkShare_workId_idx" ON "WorkShare"("workId");
CREATE INDEX "WorkShare_userId_idx" ON "WorkShare"("userId");

-- AddForeignKey
ALTER TABLE "WorkShare" ADD CONSTRAINT "WorkShare_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkShare" ADD CONSTRAINT "WorkShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
