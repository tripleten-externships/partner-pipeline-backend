/*
  Warnings:

  - You are about to drop the `invitationtokenlog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `invitationtokenlog`;

-- CreateTable
CREATE TABLE `InvitationTokenLog` (
    `id` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL DEFAULT '',
    `before` JSON NULL,
    `after` JSON NULL,
    `timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
