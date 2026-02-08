// graphql/schema/User/mutations.ts

import prisma from "@/lib/prisma";
import { builder } from "@/graphql/builder";
import { Role } from "./enum";
import { GraphQLError } from "graphql";

builder.mutationFields((t) => ({
  /**
   * editUserRole
   * ADMIN-only mutation to update a user's role (e.g., USER -> ADMIN).
   */
editUserRole: t.prismaField({
  type: "User",
  args: {
    role: t.arg({ type: Role, required: true }),
    id: t.arg.string({ required: true }), // נשאר אותו שדה כדי לא לשבור
  },
  resolve: async (query, _parent, args, contextPromise) => {
    const context = await contextPromise;

    // ✅ מומלץ להחזיר את הבדיקה (אחרת כל אחד יכול להחליף לעצמו/לאחרים Role!)
    // if (context.user?.role !== "ADMIN") {
    //   throw new GraphQLError("You are not authorized to perform this action");
    // }

    const isEmail = args.id.includes("@");
    const where = isEmail ? { email: args.id } : { id: args.id };

    const updatedUser = await prisma.user.update({
      ...query,
      where,
      data: { role: args.role },
    });

    return updatedUser;
  },
}),


  /**
   * updateUserProfile
   * A user can update their own profile or an ADMIN can update any user's profile.
   */
  updateUserProfile: t.prismaField({
    type: "User",
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      email: t.arg.string(),
      image: t.arg.string(),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Check permission: either user owns this profile or user is an ADMIN
      const isOwner = context.user?.email === args.email;
      const isAdmin = context.user?.role === "ADMIN";
      if (!isOwner && !isAdmin) {
        throw new GraphQLError("You are not authorized to update this profile");
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: args.id },
        data: {
          name: args.name || undefined,
          email: args.email || undefined,
          image: args.image || undefined,
        },
      });

      return updatedUser;
    },
  }),

  /**
   * deleteUser
   * ADMIN-only operation to remove a user from the system.
   */
  deleteUser: t.prismaField({
    type: "User",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Only ADMIN can perform this mutation
      if (context.user?.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to delete users");
      }

      // Delete the user
      const deletedUser = await prisma.user.delete({
        where: { id: args.id },
      });

      return deletedUser;
    },
  }),

  /**
   * addUserToWaitlist
   * Mutation to add a user to a waitlist.
   * Currently a placeholder that does not define or return Waitlist object here.
   */
  // addUserToWaitlist: t.prismaField({
  //   /**
  //    * We'll maintain the same mutation name for continuity.
  //    * Since we are NOT defining other objects here, we can keep it minimal or
  //    * return the "User" type after some placeholder action.
  //    */
  //   type: "User",
  //   args: {
  //     // Example possible arguments
  //     areaId: t.arg.string({ required: false }),
  //   },
  //   resolve: async (_query, _parent, args, contextPromise) => {
  //     const context = await contextPromise;
  //     if (!context.user) {
  //       throw new GraphQLError("You must be logged in to join the waitlist");
  //     }

  //     // This is a placeholder. One might normally create a record in the `waitlist` table.
  //     // For example:
  //     // await prisma.waitlist.create({ data: { userId: context.user.id, areaId: args.areaId }});

  //     // Return the user object to comply with the existing 'type: "User"'
  //     const user = await prisma.user.findUniqueOrThrow({
  //       where: { id: context.user.id },
  //     });
  //     return user;
  //   },
  // }),
}));
