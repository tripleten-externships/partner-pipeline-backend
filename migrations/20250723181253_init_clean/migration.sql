-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL DEFAULT 'Student',
    `isAdmin` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projects` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_projects_idx`(`projects`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserLog` (
    `id` VARCHAR(191) NOT NULL,
    `user` VARCHAR(191) NULL,
    `operation` VARCHAR(191) NOT NULL DEFAULT '',
    `before` JSON NULL,
    `after` JSON NULL,
    `timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserLog_user_idx`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `project` VARCHAR(191) NOT NULL DEFAULT '',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `lastUpdate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `Milestone` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NULL DEFAULT 'not_started',
    `project` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,

    INDEX `Milestone_project_idx`(`project`),
    INDEX `Milestone_updatedBy_idx`(`updatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_projects_fkey` FOREIGN KEY (`projects`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLog` ADD CONSTRAINT `UserLog_user_fkey` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectLog` ADD CONSTRAINT `ProjectLog_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_project_fkey` FOREIGN KEY (`project`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
