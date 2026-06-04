-- Add publishing fields to Work table
-- publishMode: null = private, "whole" = full work public, "snippet" = teaser only
-- snippet: the public teaser HTML when publishMode = "snippet"
ALTER TABLE "Work" ADD COLUMN "publishMode" TEXT;
ALTER TABLE "Work" ADD COLUMN "snippet" TEXT;
