/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `InvitationToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `invitationtoken` DROP FOREIGN KEY `InvitationToken_project_fkey`;

-- DropIndex
DROP INDEX `InvitationToken_tokenHash_idx` ON `invitationtoken`;

-- CreateIndex
CREATE UNIQUE INDEX `InvitationToken_tokenHash_key` ON `InvitationToken`(`tokenHash`);

-- AddForeignKey
ALTER TABLE `InvitationToken` ADD CONSTRAINT `InvitationToken_project_fkey` FOREIGN KEY (`project`) REFERENCES `ProjectInvitation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
