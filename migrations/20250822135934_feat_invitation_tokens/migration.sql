-- CreateTable
CREATE TABLE `InvitationToken` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL DEFAULT '',
    `project` VARCHAR(191) NULL,
    `roleToGrant` VARCHAR(191) NOT NULL DEFAULT 'Student',
    `expiresAt` DATETIME(3) NOT NULL,
    `maxUses` INTEGER NULL DEFAULT 1,
    `usedCount` INTEGER NULL DEFAULT 0,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NOT NULL DEFAULT '',

    INDEX `InvitationToken_tokenHash_idx`(`tokenHash`),
    INDEX `InvitationToken_project_idx`(`project`),
    INDEX `InvitationToken_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvitationTokenLog` (
    `id` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL DEFAULT '',
    `before` VARCHAR(191) NOT NULL DEFAULT '',
    `after` VARCHAR(191) NOT NULL DEFAULT '',
    `timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InvitationToken` ADD CONSTRAINT `InvitationToken_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationToken` ADD CONSTRAINT `InvitationToken_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
