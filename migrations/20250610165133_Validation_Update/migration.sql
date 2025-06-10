/*
  Warnings:

  - You are about to drop the column `project` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `project`,
    MODIFY `role` VARCHAR(191) NULL DEFAULT 'Student';
