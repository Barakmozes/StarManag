// graphql/schema/Reservation/mutations.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { ReservationStatus } from "./enum";
import { Role } from "@/graphql/schema/User/enum";
import { Role as PrismaRole } from "@prisma/client";

const RESERVATION_DURATION_MINUTES =
  parseInt(process.env.RESERVATION_DURATION_MINUTES || "") || 120;
const MIN_RESERVATION_ADVANCE_HOURS =
  parseInt(process.env.MIN_RESERVATION_ADVANCE_HOURS || "") || 2;
const MAX_ACTIVE_RESERVATIONS =
  parseInt(process.env.MAX_ACTIVE_RESERVATIONS || "") || 3;

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

type OpenDay = { day: string; open: string; close: string; closed: boolean };

function validateOpeningHours(openTimes: unknown, requestedTime: Date): void {
  if (!openTimes || !Array.isArray(openTimes)) return;
  const dayName = DAY_NAMES[requestedTime.getDay()];
  const dayEntry = (openTimes as OpenDay[]).find((d) => d.day === dayName);
  if (!dayEntry) return;
  if (dayEntry.closed) {
    throw new GraphQLError("The restaurant is closed on this day");
  }
  const hh = String(requestedTime.getHours()).padStart(2, "0");
  const mm = String(requestedTime.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;
  if (timeStr < dayEntry.open || timeStr >= dayEntry.close) {
    throw new GraphQLError("The restaurant is closed at the requested time");
  }
}

  
  // --- addGuestReservation ---
builder.mutationFields((t) => ({
  /**
   * addGuestReservation
   * יצירת הזמנה לאורח מזדמן + יצירת משתמש פיקטיבי אם לא קיים.
   */
  addGuestReservation: t.prismaField({
    type: "Reservation",
    args: {
      customerName: t.arg.string({ required: true }),
      tableId: t.arg.string({ required: true }),
      reservationTime: t.arg({ type: "DateTime", required: true }),
      numOfDiners: t.arg.int({ required: true }),
      createdBy: t.arg({ type: Role, required: true }),
      phoneNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      
      // אבטחה
      if (!context.user || (context.user.role !== "ADMIN" && context.user.role !== "MANAGER")) {
        throw new GraphQLError("רק מנהלים מורשים לבצע הזמנת אורח ללא אימייל");
      }

      // יצירת אימייל פיקטיבי ייחודי
      const guestId = Date.now().toString().slice(-6);
      const safeName = args.customerName.trim().replace(/\s+/g, '_');
      const guestEmail = `guest_${safeName}_${guestId}@internal.local`;

      return prisma.reservation.create({
        ...query,
        data: {
          // --- שדות רגילים ---
          reservationTime: args.reservationTime,
          numOfDiners: args.numOfDiners,
          createdBy: args.createdBy,

          // --- תיקון השגיאה: שימוש ב-RELATIONS בלבד ---
          
          // 1. במקום tableId: args.tableId, אנו משתמשים ב-connect
          table: {
            connect: { id: args.tableId }
          },

          // 2. יצירת/חיבור המשתמש הפיקטיבי
          user: {
            connectOrCreate: {
              where: { email: guestEmail },
              create: {
                email: guestEmail,
                name: args.customerName,
                role: PrismaRole.USER,
                // הסרתי את password כי השגיאה הראתה שהוא לא קיים ב-User שלך
                // אם יש לך שדות חובה אחרים ב-User (כמו phone), הוסף אותם כאן
              }
            }
          }
        },
      });
    },
  }),
  // --- addReservation (רגיל) ---
  addReservation: t.prismaField({
    type: "Reservation",
    args: {
      userEmail: t.arg.string({ required: true }),
      tableId: t.arg.string({ required: true }),
      reservationTime: t.arg({ type: "DateTime", required: true }),
      numOfDiners: t.arg.int({ required: true }),

      // IMPORTANT: Make `createdBy` an enum argument
      createdBy: t.arg({ type: Role, required: true }),

      // Optionally store which user created it (email).
      createdByUserEmail: t.arg.string(),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in to create a reservation");
      }

      const isAdminOrManager =
        context.user.role === "ADMIN" || context.user.role === "MANAGER";

      if (!isAdminOrManager && context.user.email !== args.userEmail) {
        throw new GraphQLError("You are not authorized to create a reservation for this user");
      }

      const reservationTime = new Date(args.reservationTime);

      // Guard 1: Minimum advance time (skip for staff bookings)
      if (!isAdminOrManager) {
        const minAdvanceMs = MIN_RESERVATION_ADVANCE_HOURS * 60 * 60 * 1000;
        if (reservationTime.getTime() < Date.now() + minAdvanceMs) {
          throw new GraphQLError(
            `Reservations must be made at least ${MIN_RESERVATION_ADVANCE_HOURS} hours in advance.`
          );
        }
      }

      // Guard 2: Opening hours validation
      const restaurant = await prisma.restaurant.findFirst();
      if (restaurant) {
        validateOpeningHours(restaurant.openTimes, reservationTime);
      }

      // Guard 3: Active reservation limit (skip for staff bookings)
      if (!isAdminOrManager) {
        const activeCount = await prisma.reservation.count({
          where: {
            userEmail: args.userEmail,
            status: { in: ["PENDING", "CONFIRMED"] },
            reservationTime: { gte: new Date() },
          },
        });
        if (activeCount >= MAX_ACTIVE_RESERVATIONS) {
          throw new GraphQLError(
            `You have reached the maximum number of active reservations (${MAX_ACTIVE_RESERVATIONS}).`
          );
        }
      }

      // Guard 4: Race condition — check for overlapping reservation on the same table
      const durationMs = RESERVATION_DURATION_MINUTES * 60 * 1000;
      const windowEnd = new Date(reservationTime.getTime() + durationMs);
      const overlap = await prisma.reservation.findFirst({
        where: {
          tableId: args.tableId,
          status: { in: ["PENDING", "CONFIRMED"] },
          reservationTime: {
            gt: new Date(reservationTime.getTime() - durationMs),
            lt: windowEnd,
          },
        },
      });
      if (overlap) {
        throw new GraphQLError(
          "This table was just booked. Please select another."
        );
      }

      const reservation = await prisma.reservation.create({
        ...query,
        data: {
          userEmail: args.userEmail,
          tableId: args.tableId,
          reservationTime: args.reservationTime,
          numOfDiners: args.numOfDiners,
          createdBy: args.createdBy,
          createdByUserEmail: args.createdByUserEmail ?? null,
        },
      });
      return reservation;
    },
  }),

  

  /**
   * editReservation
   * Updates fields like 'reservationTime', 'numOfDiners', or 'status'.
   */
  editReservation: t.prismaField({
    type: "Reservation",
    args: {
      id: t.arg.string({ required: true }),
      reservationTime: t.arg({ type: "DateTime" }),
      numOfDiners: t.arg.int(),
      status: t.arg({ type: ReservationStatus }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      const currentUser = context.user;
      if (!currentUser) {
        throw new GraphQLError("You must be logged in to edit a reservation");
      }

      // Retrieve existing reservation
      const existing = await prisma.reservation.findUnique({
        where: { id: args.id },
      });
      if (!existing) {
        throw new GraphQLError("Reservation not found");
      }

      // Only admin/manager or the reservation's user can edit
      const isAdminOrManager =
        currentUser.role === "ADMIN" || currentUser.role === "MANAGER";
      if (!isAdminOrManager && existing.userEmail !== currentUser.email) {
        throw new GraphQLError("You are not authorized to edit this reservation");
      }

      // Perform the update
      const updated = await prisma.reservation.update({
        where: { id: args.id },
        data: {
          reservationTime: args.reservationTime ?? undefined,
          numOfDiners: args.numOfDiners ?? undefined,
          status: args.status ?? undefined,
        },
      });
      return updated;
    },
  }),

  /**
   * cancelReservation
   * Sets the status to CANCELLED, if the reservation is still active.
   */
  cancelReservation: t.prismaField({
    type: "Reservation",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      const currentUser = context.user;
      if (!currentUser) {
        throw new GraphQLError("You must be logged in to cancel a reservation");
      }

      // Retrieve existing reservation
      const existing = await prisma.reservation.findUnique({
        where: { id: args.id },
      });
      if (!existing) {
        throw new GraphQLError("Reservation not found");
      }

      // Only admin/manager or the reservation's user can cancel
      const isAdminOrManager =
        currentUser.role === "ADMIN" || currentUser.role === "MANAGER";
      if (!isAdminOrManager && existing.userEmail !== currentUser.email) {
        throw new GraphQLError("You are not authorized to cancel this reservation");
      }

      // Check if it's already cancelled or completed
      if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
        throw new GraphQLError("Reservation cannot be cancelled in its current state");
      }

      // Cancel the reservation
      const cancelled = await prisma.reservation.update({
        where: { id: args.id },
        data: {
          status: "CANCELLED" as any,
        },
      });
      return cancelled;
    },
  }),

  /**
   * completeReservation
   * Sets the status to COMPLETED. Typically an admin or manager might do this once the reservation is done.
   */
  completeReservation: t.prismaField({
    type: "Reservation",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      const currentUser = context.user;
      if (!currentUser) {
        throw new GraphQLError("You must be logged in to complete a reservation");
      }

      // Retrieve existing reservation
      const existing = await prisma.reservation.findUnique({
        where: { id: args.id },
      });
      if (!existing) {
        throw new GraphQLError("Reservation not found");
      }

      // Typically only admin/manager can mark a reservation completed
      if (
        currentUser.role !== "ADMIN" &&
        currentUser.role !== "MANAGER"
      ) {
        throw new GraphQLError("You are not authorized to complete this reservation");
      }

      // If it's already completed or cancelled, no further action
      if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
        throw new GraphQLError("Reservation cannot be completed in its current state");
      }

      // Complete the reservation
      const completed = await prisma.reservation.update({
        where: { id: args.id },
        data: {
          status: "COMPLETED" as any,
        },
      });
      return completed;
    },
  }),
}));
