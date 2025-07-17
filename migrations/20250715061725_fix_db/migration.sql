-- CreateTable
CREATE TABLE `ProjectLog` (
    `id` VARCHAR(191) NOT NULL,
    `project` VARCHAR(191) NULL,
    `operation` VARCHAR(191) NOT NULL DEFAULT '',
    `before` JSON NULL,
    `after` JSON NULL,
    `timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectLog_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectLog` ADD CONSTRAINT `ProjectLog_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
