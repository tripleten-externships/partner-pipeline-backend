/*
  Warnings:

  - You are about to drop the column `projectInvitation` on the `invitationtoken` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `invitationtoken` DROP FOREIGN KEY `InvitationToken_projectInvitation_fkey`;

-- AlterTable
ALTER TABLE `invitationtoken` DROP COLUMN `projectInvitation`,
    ADD COLUMN `project` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `project` DROP COLUMN `status`,
    DROP COLUMN `subtitle`,
    ADD COLUMN `project` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `InvitationToken_project_idx` ON `InvitationToken`(`project`);

-- AddForeignKey
ALTER TABLE `InvitationToken` ADD CONSTRAINT `InvitationToken_project_fkey` FOREIGN KEY (`project`) REFERENCES `ProjectInvitation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
