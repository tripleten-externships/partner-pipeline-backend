/*
  Warnings:

  - You are about to drop the column `projectId` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `ActivityLog_projectId_idx` ON `ActivityLog`;

-- AlterTable
ALTER TABLE `ActivityLog` DROP COLUMN `projectId`,
    ADD COLUMN `project` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ActivityLog_project_idx` ON `ActivityLog`(`project`);

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
