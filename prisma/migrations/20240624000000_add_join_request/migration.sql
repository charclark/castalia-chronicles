CREATE TABLE "JoinRequest" (
    "id"                     TEXT NOT NULL,
    "fullName"               TEXT NOT NULL,
    "email"                  TEXT NOT NULL,
    "requestedUsername"      TEXT NOT NULL,
    "genres"                 TEXT NOT NULL,
    "aboutYou"               TEXT NOT NULL,
    "existingWorkLink"       TEXT,
    "howDidYouHear"          TEXT,
    "confirmedAge"           BOOLEAN NOT NULL,
    "confirmedOriginalAuthor" BOOLEAN NOT NULL,
    "confirmedPlagiarism"    BOOLEAN NOT NULL,
    "confirmedApproval"      BOOLEAN NOT NULL,
    "confirmedPersonalUse"   BOOLEAN NOT NULL,
    "confirmedRightToRefuse" BOOLEAN NOT NULL,
    "confirmedTerms"         BOOLEAN NOT NULL,
    "termsVersion"           TEXT NOT NULL,
    "ipAddress"              TEXT NOT NULL,
    "submittedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status"                 TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt"             TIMESTAMP(3),
    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JoinRequest_status_idx" ON "JoinRequest"("status");
CREATE INDEX "JoinRequest_submittedAt_idx" ON "JoinRequest"("submittedAt");
