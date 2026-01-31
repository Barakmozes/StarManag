-- CreateIndex
CREATE INDEX "order_orderDate_status_idx" ON "Order"("orderDate", "status");

-- CreateIndex
CREATE INDEX "order_userEmail_orderDate_idx" ON "Order"("userEmail", "orderDate");

-- CreateIndex
CREATE INDEX "order_status_orderDate_idx" ON "Order"("status", "orderDate");

-- RenameIndex
ALTER INDEX "Order_tableId_idx" RENAME TO "order_tableId_idx";
