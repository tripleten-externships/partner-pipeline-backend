-- AlterTable
ALTER TABLE `user` ADD COLUMN `projects` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_projects_idx` ON `User`(`projects`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_projects_fkey` FOREIGN KEY (`projects`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
