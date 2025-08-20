/*
  Warnings:

  - You are about to drop the column `project` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ActivityLog` DROP FOREIGN KEY `ActivityLog_project_fkey`;

-- AlterTable
ALTER TABLE `ActivityLog` DROP COLUMN `project`,
    ADD COLUMN `projectId` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `ActivityLog_projectId_idx` ON `ActivityLog`(`projectId`);
