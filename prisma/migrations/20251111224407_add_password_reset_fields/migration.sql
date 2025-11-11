-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordResetExpiry` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL;
