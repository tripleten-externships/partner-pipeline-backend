/*
  Warnings:

  - You are about to drop the column `phone` on the `waitlistentry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `waitlistentry` DROP COLUMN `phone`;

-- CreateTable
CREATE TABLE `waitListStudent` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NULL DEFAULT 'pending',
    `inviteSentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `waitListStudent_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
