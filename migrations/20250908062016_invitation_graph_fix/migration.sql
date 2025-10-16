/*
  Warnings:

  - You are about to drop the column `project` on the `invitationtoken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `invitationtoken` DROP FOREIGN KEY `InvitationToken_project_fkey`;

-- AlterTable
ALTER TABLE `invitationtoken` DROP COLUMN `project`,
    ADD COLUMN `projectInvitation` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `InvitationToken_projectInvitation_idx` ON `InvitationToken`(`projectInvitation`);

-- AddForeignKey
ALTER TABLE `InvitationToken` ADD CONSTRAINT `InvitationToken_projectInvitation_fkey` FOREIGN KEY (`projectInvitation`) REFERENCES `ProjectInvitation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
