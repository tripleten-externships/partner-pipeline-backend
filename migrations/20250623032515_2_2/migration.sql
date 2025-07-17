/*
  Warnings:

  - You are about to drop the `_project_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_project_members` DROP FOREIGN KEY `_Project_members_A_fkey`;

-- DropForeignKey
ALTER TABLE `_project_members` DROP FOREIGN KEY `_Project_members_B_fkey`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `project` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `_project_members`;

-- CreateIndex
CREATE INDEX `User_project_idx` ON `User`(`project`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
