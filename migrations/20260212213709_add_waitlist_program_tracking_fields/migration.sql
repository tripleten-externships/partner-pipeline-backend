/*
  Warnings:

  - You are about to drop the `waitlistentry` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `waitliststudent` ADD COLUMN `completedOn` DATETIME(3) NULL,
    ADD COLUMN `contactedBy` VARCHAR(191) NULL,
    ADD COLUMN `hasVoucher` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastContactedOn` DATETIME(3) NULL,
    ADD COLUMN `notes` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `program` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `waitlistentry`;

-- CreateIndex
CREATE INDEX `waitListStudent_contactedBy_idx` ON `waitListStudent`(`contactedBy`);

-- AddForeignKey
ALTER TABLE `waitListStudent` ADD CONSTRAINT `waitListStudent_contactedBy_fkey` FOREIGN KEY (`contactedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
