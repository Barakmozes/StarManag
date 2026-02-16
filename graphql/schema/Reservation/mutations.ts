// graphql/schema/Reservation/mutations.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { ReservationStatus } from "./enum"; // if using the ReservationStatus enum
import { Role } from "@/graphql/schema/User/enum"; // or wherever your Role enum is
import { Role as PrismaRole } from "@prisma/client";

  
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

      // Now 'args.createdBy' is typed as 'Role'
      const reservation = await prisma.reservation.create({
        ...query,
        data: {
          userEmail: args.userEmail,
          tableId: args.tableId,
          reservationTime: args.reservationTime,
          numOfDiners: args.numOfDiners,
          createdBy: args.createdBy, // no TS error now
          createdByUserEmail: args.createdByUserEmail ?? null,
          // status defaults to PENDING
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
