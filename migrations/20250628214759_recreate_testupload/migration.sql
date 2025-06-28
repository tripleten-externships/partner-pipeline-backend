-- CreateTable
CREATE TABLE `TestUpload` (
    `id` VARCHAR(191) NOT NULL,
    `upload_id` VARCHAR(191) NULL,
    `upload_filesize` INTEGER NULL,
    `upload_width` INTEGER NULL,
    `upload_height` INTEGER NULL,
    `upload_extension` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
