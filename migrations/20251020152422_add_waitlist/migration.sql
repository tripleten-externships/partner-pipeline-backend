-- CreateTable
CREATE TABLE `Waitlist` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('PENDING', 'CONTACTED', 'INVITED', 'JOINED') NULL DEFAULT 'PENDING',
    `source` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Waitlist_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
