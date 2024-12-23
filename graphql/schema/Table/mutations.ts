// graphql/schema/Table/mutations.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

/**
 * Mutation Fields for Table
 */
builder.mutationFields((t) => ({
  /**
   * addTable
   * Creates a new table. Requires an ADMIN user (or staff) to manage table creation.
   */
  addTable: t.prismaField({
    type: "Table",
    args: {
      tableNumber: t.arg.int({ required: true }),
      diners: t.arg.int({ required: true }),
      position: t.arg({ type: "JSON", required: true }),
      areaId: t.arg.string({ required: true }),
      reserved: t.arg.boolean(), // optional
      specialRequests: t.arg.stringList(), // optional
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Check user authentication
      if (!context.user) {
        throw new GraphQLError("You must be logged in to perform this action");
      }
      // Check user authorization (ADMIN recommended for table creation)
      if (context.user.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to add tables");
      }

      // Check if the tableNumber is already taken
      const existing = await prisma.table.findFirst({
        where: { tableNumber: args.tableNumber },
      });
      if (existing) {
        throw new GraphQLError("A table with this tableNumber already exists");
      }

      // Create a new table
      const newTable = await prisma.table.create({
        ...query,
        data: {
          tableNumber: args.tableNumber,
          diners: args.diners,
          position: args.position,
          areaId: args.areaId,
          reserved: args.reserved ?? false,
          specialRequests: args.specialRequests ?? [],
        },
      });
      return newTable;
    },
  }),

  /**
   * editTable
   * Updates a table's fields by ID. Requires ADMIN permissions for full edits.
   */
  editTable: t.prismaField({
    type: "Table",
    args: {
      id: t.arg.string({ required: true }),
      tableNumber: t.arg.int(),
      diners: t.arg.int(),
      reserved: t.arg.boolean(),
      position: t.arg({ type: "JSON" }),
      specialRequests: t.arg.stringList(),
      areaId: t.arg.string(),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      if (!context.user) {
        throw new GraphQLError("You must be logged in to perform this action");
      }
      if (context.user.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to edit tables");
      }

      // Attempt to update
      const updatedTable = await prisma.table.update({
        where: { id: args.id },
        data: {
          tableNumber: args.tableNumber ?? undefined,
          diners: args.diners ?? undefined,
          reserved: args.reserved ?? undefined,
          position: args.position ?? undefined,
          specialRequests: args.specialRequests ?? undefined,
          areaId: args.areaId ?? undefined,
        },
      });
      return updatedTable;
    },
  }),

  /**
   * deleteTable
   * Deletes a table by ID. Usually, only ADMIN can delete a table.
   */
  deleteTable: t.prismaField({
    type: "Table",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      if (!context.user) {
        throw new GraphQLError("You must be logged in to perform this action");
      }
      if (context.user.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to delete tables");
      }

      const deletedTable = await prisma.table.delete({
        where: { id: args.id },
      });
      return deletedTable;
    },
  }),

  /**
   * toggleTableReservation
   * Allows toggling the 'reserved' status of a table. Depending on your app,
   * you might let staff or admins do this. If you want only Admin, keep the check.
   */
  toggleTableReservation: t.prismaField({
    type: "Table",
    args: {
      id: t.arg.string({ required: true }),
      reserved: t.arg.boolean({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in to perform this action");
      }
      if (context.user.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to modify reservation status");
      }

      const table = await prisma.table.findUnique({ where: { id: args.id } });
      if (!table) {
        throw new GraphQLError("Table not found");
      }

      // Update the reserved field
      const updatedTable = await prisma.table.update({
        where: { id: args.id },
        data: { reserved: args.reserved },
      });
      return updatedTable;
    },
  }),
}));
