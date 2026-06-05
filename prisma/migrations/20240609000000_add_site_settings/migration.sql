-- Add SiteSettings table for public site configuration (bio, author photo).
-- Singleton pattern: only one row is ever inserted (id = 'singleton').
CREATE TABLE "SiteSettings" (
  "id"        TEXT    NOT NULL DEFAULT 'singleton',
  "bio"       TEXT,
  "photoData" BYTEA,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
