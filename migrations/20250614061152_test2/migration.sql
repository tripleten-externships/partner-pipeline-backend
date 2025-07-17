/*
  Warnings:

  - You are about to drop the column `lastLoginDate` on the `project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `project` DROP COLUMN `lastLoginDate`,
    ADD COLUMN `lastUpdate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);
