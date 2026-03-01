-- CreateEnum
CREATE TYPE "DisplayStation" AS ENUM ('KITCHEN', 'BAR');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'RECALLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BARTENDER';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "station" "DisplayStation" NOT NULL DEFAULT 'KITCHEN';

-- CreateTable
CREATE TABLE "KitchenTicket" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "station" "DisplayStation" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTicketItem" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "menuTitle" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "prepare" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "status" "TicketItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenTicketItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KitchenTicket_station_status_idx" ON "KitchenTicket"("station", "status");

-- CreateIndex
CREATE INDEX "KitchenTicket_status_createdAt_idx" ON "KitchenTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "KitchenTicket_station_status_priority_idx" ON "KitchenTicket"("station", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenTicket_orderId_station_key" ON "KitchenTicket"("orderId", "station");

-- CreateIndex
CREATE INDEX "KitchenTicketItem_ticketId_idx" ON "KitchenTicketItem"("ticketId");

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicketItem" ADD CONSTRAINT "KitchenTicketItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "KitchenTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
