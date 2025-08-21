/*
  Warnings:

  - You are about to drop the column `user` on the `activitylog` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `milestone` table. All the data in the column will be lost.
  - Made the column `status` on table `milestone` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `activitylog` DROP FOREIGN KEY `ActivityLog_user_fkey`;

-- AlterTable
ALTER TABLE `activitylog` DROP COLUMN `user`,
    ADD COLUMN `project` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `milestone` DROP COLUMN `name`,
    ADD COLUMN `assignee` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `milestoneName` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'not_started';

-- CreateIndex
CREATE INDEX `ActivityLog_project_idx` ON `ActivityLog`(`project`);

-- CreateIndex
CREATE INDEX `ActivityLog_updatedBy_idx` ON `ActivityLog`(`updatedBy`);

-- CreateIndex
CREATE INDEX `Milestone_status_idx` ON `Milestone`(`status`);

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
