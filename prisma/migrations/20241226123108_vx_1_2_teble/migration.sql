-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "userPhone" DROP NOT NULL,
ALTER COLUMN "deliveryAddress" DROP NOT NULL,
ALTER COLUMN "deliveryFee" DROP NOT NULL;
