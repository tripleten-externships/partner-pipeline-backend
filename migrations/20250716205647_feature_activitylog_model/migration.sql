-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `oldStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `newStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` VARCHAR(191) NOT NULL DEFAULT '',
    `milestoneId` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedBy` VARCHAR(191) NULL,

    INDEX `ActivityLog_projectId_idx`(`projectId`),
    INDEX `ActivityLog_milestoneId_idx`(`milestoneId`),
    INDEX `ActivityLog_updatedBy_idx`(`updatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
