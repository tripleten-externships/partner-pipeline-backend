/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
-- DROP TABLE `user`;

-- -- CreateTable
-- CREATE TABLE `User` (
--     `id` VARCHAR(191) NOT NULL,
--     `name` VARCHAR(191) NOT NULL DEFAULT '',
--     `email` VARCHAR(191) NOT NULL DEFAULT '',
--     `password` VARCHAR(191) NOT NULL,
--     `role` VARCHAR(191) NOT NULL DEFAULT 'Student',
--     `isAdmin` BOOLEAN NOT NULL DEFAULT true,
--     `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
--     `project` VARCHAR(191) NOT NULL DEFAULT '',
--     `isActive` BOOLEAN NOT NULL DEFAULT false,
--     `lastLoginDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

--     UNIQUE INDEX `User_email_key`(`email`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
