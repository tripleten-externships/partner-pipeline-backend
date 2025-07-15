/*
  Warnings:

  - You are about to drop the `_project_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_project_members` DROP FOREIGN KEY `_Project_members_A_fkey`;

-- DropForeignKey
ALTER TABLE `_project_members` DROP FOREIGN KEY `_Project_members_B_fkey`;

-- DropTable
DROP TABLE `_project_members`;
