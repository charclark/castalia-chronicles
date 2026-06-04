-- FeedbackMessage: public visitor messages via the Feedback popup
CREATE TABLE "FeedbackMessage" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "email"     TEXT,
  "message"   TEXT         NOT NULL,
  "read"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackMessage_pkey" PRIMARY KEY ("id")
);

-- MailingListEntry: email addresses from the Subscribe popup
CREATE TABLE "MailingListEntry" (
  "id"        TEXT         NOT NULL,
  "email"     TEXT         NOT NULL,
  "name"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MailingListEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailingListEntry_email_key" ON "MailingListEntry"("email");
