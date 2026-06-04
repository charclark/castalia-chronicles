-- Add description and buyLinks fields to Work table
-- description: short synopsis for public book/story listing
-- buyLinks: JSON string [{label: string, url: string}] for published books buy buttons
ALTER TABLE "Work" ADD COLUMN "description" TEXT;
ALTER TABLE "Work" ADD COLUMN "buyLinks" TEXT;
