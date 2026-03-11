-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_orderId_fkey";

-- AlterTable
ALTER TABLE "measurement_appointments" ADD COLUMN     "cancelReason" TEXT;

-- AlterTable
ALTER TABLE "portfolio" ALTER COLUMN "orderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
