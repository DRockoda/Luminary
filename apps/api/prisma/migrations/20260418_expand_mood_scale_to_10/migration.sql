-- Expand entry mood scale from 1-5 to 1-10.
-- Maps: 1->2, 2->4, 3->5, 4->7, 5->9

UPDATE "Entry"
SET "moodScore" = CASE
  WHEN "moodScore" = 1 THEN 2
  WHEN "moodScore" = 2 THEN 4
  WHEN "moodScore" = 3 THEN 5
  WHEN "moodScore" = 4 THEN 7
  WHEN "moodScore" = 5 THEN 9
  ELSE "moodScore"
END
WHERE "moodScore" BETWEEN 1 AND 5
  AND "deletedAt" IS NULL;

UPDATE "Entry"
SET "moodScore" = CASE
  WHEN "moodScore" = 1 THEN 2
  WHEN "moodScore" = 2 THEN 4
  WHEN "moodScore" = 3 THEN 5
  WHEN "moodScore" = 4 THEN 7
  WHEN "moodScore" = 5 THEN 9
  ELSE "moodScore"
END
WHERE "moodScore" BETWEEN 1 AND 5
  AND "deletedAt" IS NOT NULL;
