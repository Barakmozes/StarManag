-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_orderNum_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userEmail_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userEmail_fkey";

-- DropForeignKey
ALTER TABLE "Waitlist" DROP CONSTRAINT "Waitlist_areaId_fkey";

-- DropForeignKey
ALTER TABLE "Waitlist" DROP CONSTRAINT "Waitlist_userEmail_fkey";

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderNum_fkey" FOREIGN KEY ("orderNum") REFERENCES "Order"("orderNumber") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;
