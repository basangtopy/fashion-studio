-- AlterTable
ALTER TABLE "users" ADD COLUMN     "oauthCode" TEXT,
ADD COLUMN     "oauthCodeExpiry" TIMESTAMP(3);
