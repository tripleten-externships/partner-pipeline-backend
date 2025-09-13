/*
  Warnings:

  - You are about to alter the column `after` on the `invitationtokenlog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `invitationtokenlog` ADD COLUMN `before` JSON NULL,
    MODIFY `after` JSON NULL;
