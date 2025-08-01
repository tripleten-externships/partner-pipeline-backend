/*
  Warnings:

  - You are about to drop the column `projectId` on the `milestone` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Milestone_projectId_idx` ON `milestone`;

-- AlterTable
ALTER TABLE `milestone` DROP COLUMN `projectId`,
    ADD COLUMN `project` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Milestone_project_idx` ON `Milestone`(`project`);

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
