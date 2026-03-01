// graphql/schema/Menu/mutations.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

/**
 * Mutation Fields for Menu
 */
builder.mutationFields((t) => ({
  /**
   * addMenu
   * Creates a new menu entry if one does not already exist with the same title.
   * Requires an ADMIN user.
   */
  addMenu: t.prismaField({
    type: "Menu",
    args: {
      title: t.arg.string({ required: true }),
      shortDescr: t.arg.string({ required: true }),
      longDescr: t.arg.string({ required: true }),
      price: t.arg.float({ required: true }),
      sellingPrice: t.arg.float(),
      image: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      categoryId: t.arg.string(),
      prepType: t.arg.stringList({ required: true }),
      onPromo: t.arg.boolean({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Only an ADMIN can add a menu item
      if (context.user?.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to perform this action");
      }

      return prisma.$transaction(async (tx) => {
        // If categoryId provided, verify it exists
        if (args.categoryId) {
          const cat = await tx.category.findUnique({ where: { id: args.categoryId } });
          if (!cat) throw new GraphQLError(`Category not found: ${args.categoryId}`);
        }

        // Check if a menu with this title already exists
        const existingMenu = await tx.menu.findFirst({
          ...query,
          where: { title: args.title },
        });
        if (existingMenu) {
          throw new GraphQLError("Menu already exists");
        }

        // Create a new menu item
        return tx.menu.create({
          data: {
            title: args.title,
            shortDescr: args.shortDescr,
            longDescr: args.longDescr,
            price: args.price,
            sellingPrice: args.sellingPrice ?? undefined,
            image: args.image,
            category: args.category,
            categoryId: args.categoryId ?? undefined,
            prepType: args.prepType,
            onPromo: args.onPromo,
          },
        });
      });
    },
  }),

  /**
   * editMenu
   * Updates an existing menu entry by ID. Requires an ADMIN user.
   */
  editMenu: t.prismaField({
    type: "Menu",
    args: {
      id: t.arg.string({ required: true }),
      title: t.arg.string({ required: true }),
      shortDescr: t.arg.string({ required: true }),
      longDescr: t.arg.string({ required: true }),
      price: t.arg.float({ required: true }),
      sellingPrice: t.arg.float(),
      image: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      categoryId: t.arg.string(),
      prepType: t.arg.stringList({ required: true }),
      onPromo: t.arg.boolean({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Only an ADMIN can edit a menu
      if (context.user?.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to perform this action");
      }

      return prisma.$transaction(async (tx) => {
        // If categoryId provided, verify it exists
        if (args.categoryId) {
          const cat = await tx.category.findUnique({ where: { id: args.categoryId } });
          if (!cat) throw new GraphQLError(`Category not found: ${args.categoryId}`);
        }

        // Update the menu item
        return tx.menu.update({
          where: { id: args.id },
          data: {
            title: args.title,
            shortDescr: args.shortDescr,
            longDescr: args.longDescr,
            price: args.price,
            sellingPrice: args.sellingPrice === undefined ? undefined : args.sellingPrice,
            image: args.image,
            category: args.category,
            categoryId: args.categoryId ?? undefined,
            prepType: args.prepType,
            onPromo: args.onPromo,
          },
        });
      });
    },
  }),

  /**
   * deleteMenu
   * Deletes an existing menu entry by ID. Requires an ADMIN user.
   */
  deleteMenu: t.prismaField({
    type: "Menu",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Only an ADMIN can delete a menu
      if (context.user?.role !== "ADMIN") {
        throw new GraphQLError("You are not authorized to perform this action");
      }

      // Delete the menu item
      const deletedMenu = await prisma.menu.delete({
        where: { id: args.id },
      });
      return deletedMenu;
    },
  }),
}));
