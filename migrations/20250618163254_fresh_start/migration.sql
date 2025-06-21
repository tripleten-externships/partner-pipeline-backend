/*
  Warnings:

  - You are about to drop the column `project` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `project`,
    MODIFY `role` VARCHAR(191) NULL DEFAULT 'Student';

-- CreateTable
CREATE TABLE `UserLog` (
    `id` VARCHAR(191) NOT NULL,
    `user` VARCHAR(191) NULL,
    `operation` VARCHAR(191) NOT NULL DEFAULT '',
    `before` JSON NULL,
    `after` JSON NULL,
    `timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserLog_user_idx`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserLog` ADD CONSTRAINT `UserLog_user_fkey` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
