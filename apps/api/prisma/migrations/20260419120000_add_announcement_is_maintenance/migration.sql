-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN "isMaintenance" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Announcement_isMaintenance_isActive_idx" ON "Announcement"("isMaintenance", "isActive");
