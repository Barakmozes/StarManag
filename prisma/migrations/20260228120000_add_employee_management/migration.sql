-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'AUTO_CLOSED', 'EDITED');

-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" "Role",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "shiftRole" "Role",
    "userEmail" TEXT NOT NULL,
    "createdByEmail" TEXT,
    "areaId" TEXT,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "hoursWorked" DOUBLE PRECISION,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "userEmail" TEXT NOT NULL,
    "shiftId" TEXT,
    "editedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftTemplate_areaId_idx" ON "ShiftTemplate"("areaId");

-- CreateIndex
CREATE INDEX "ShiftTemplate_dayOfWeek_idx" ON "ShiftTemplate"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Shift_userEmail_idx" ON "Shift"("userEmail");

-- CreateIndex
CREATE INDEX "Shift_createdByEmail_idx" ON "Shift"("createdByEmail");

-- CreateIndex
CREATE INDEX "Shift_areaId_idx" ON "Shift"("areaId");

-- CreateIndex
CREATE INDEX "Shift_templateId_idx" ON "Shift"("templateId");

-- CreateIndex
CREATE INDEX "shift_startTime_endTime_idx" ON "Shift"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "shift_status_startTime_idx" ON "Shift"("status", "startTime");

-- CreateIndex
CREATE INDEX "TimeEntry_userEmail_idx" ON "TimeEntry"("userEmail");

-- CreateIndex
CREATE INDEX "TimeEntry_shiftId_idx" ON "TimeEntry"("shiftId");

-- CreateIndex
CREATE INDEX "TimeEntry_editedByEmail_idx" ON "TimeEntry"("editedByEmail");

-- CreateIndex
CREATE INDEX "timeentry_clockIn_clockOut_idx" ON "TimeEntry"("clockIn", "clockOut");

-- CreateIndex
CREATE INDEX "timeentry_userEmail_clockIn_idx" ON "TimeEntry"("userEmail", "clockIn");

-- CreateIndex
CREATE INDEX "timeentry_status_clockIn_idx" ON "TimeEntry"("status", "clockIn");

-- Race condition guard: only one ACTIVE time entry per employee
CREATE UNIQUE INDEX "timeentry_one_active_per_user" ON "TimeEntry" ("userEmail") WHERE "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdByEmail_fkey" FOREIGN KEY ("createdByEmail") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ShiftTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_editedByEmail_fkey" FOREIGN KEY ("editedByEmail") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;
