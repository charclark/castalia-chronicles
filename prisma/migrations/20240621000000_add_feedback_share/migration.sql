-- CreateTable
CREATE TABLE "FeedbackShare" (
    "id" TEXT NOT NULL,
    "feedbackMessageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackShare_feedbackMessageId_userId_key" ON "FeedbackShare"("feedbackMessageId", "userId");
CREATE INDEX "FeedbackShare_feedbackMessageId_idx" ON "FeedbackShare"("feedbackMessageId");
CREATE INDEX "FeedbackShare_userId_idx" ON "FeedbackShare"("userId");

-- AddForeignKey
ALTER TABLE "FeedbackShare" ADD CONSTRAINT "FeedbackShare_feedbackMessageId_fkey" FOREIGN KEY ("feedbackMessageId") REFERENCES "FeedbackMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackShare" ADD CONSTRAINT "FeedbackShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
