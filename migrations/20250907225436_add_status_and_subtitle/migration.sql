/*
  Warnings:

  - You are about to drop the column `project` on the `project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `project` DROP COLUMN `project`,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `subtitle` VARCHAR(191) NOT NULL DEFAULT '';
