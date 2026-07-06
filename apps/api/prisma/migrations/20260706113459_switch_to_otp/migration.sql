/*
  Warnings:

  - You are about to drop the column `reset_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `reset_token_expires` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_reset_token_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "reset_token",
DROP COLUMN "reset_token_expires",
ADD COLUMN     "reset_otp" TEXT,
ADD COLUMN     "reset_otp_expires" TIMESTAMP(3);
