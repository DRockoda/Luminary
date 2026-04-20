-- AlterTable
ALTER TABLE "User"
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Feedback"
ADD COLUMN "userId" TEXT,
ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'feedback',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "email" DROP NOT NULL;

-- Backfill status from legacy boolean
UPDATE "Feedback"
SET "status" = CASE WHEN "isResolved" = true THEN 'resolved' ELSE 'open' END;

-- Cleanup old index + column
DROP INDEX IF EXISTS "Feedback_isResolved_createdAt_idx";
ALTER TABLE "Feedback" DROP COLUMN "isResolved";

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");
CREATE INDEX "Feedback_priority_createdAt_idx" ON "Feedback"("priority", "createdAt");
CREATE INDEX "Feedback_type_createdAt_idx" ON "Feedback"("type", "createdAt");
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
