/*
  Warnings:

  - You are about to drop the column `readyToWearId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `selectedSize` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_readyToWearId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "readyToWearId",
DROP COLUMN "selectedSize";

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "readyToWearId" TEXT NOT NULL,
    "selectedSize" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAtPurchase" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_readyToWearId_fkey" FOREIGN KEY ("readyToWearId") REFERENCES "ready_to_wear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
