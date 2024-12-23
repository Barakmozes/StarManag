// graphql/schema/Area/queries.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

/**
 * Pothos Prisma Object: Area
 *
 * Reflects the Prisma Area model:
 *  - id (String, cuid)
 *  - name (String, unique)
 *  - description (String?)
 *  - floorPlanImage (String?)
 *  - parentId (String?)
 *  - parent (Area?) [self-relation]
 *  - children (Area[]) [self-relation]
 *  - restaurantId (String)
 *  - restaurant (Restaurant) [relation to Restaurant]
 *  - gridConfig (GridConfig?)
 *  - waitlists (Waitlist[])
 *  - tables (Table[])
 *  - createdAt (DateTime)
 *  - updatedAt (DateTime)
 *
 * For simplicity, we only define the fields directly on the Area model.
 * We do not define other objects (Restaurant, GridConfig, etc.) here.
 */
builder.prismaObject("Area", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    floorPlanImage: t.exposeString("floorPlanImage", { nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),

    // Self-relations
    parent: t.relation("parent", { nullable: true }),
    children: t.relation("children"),

    // Foreign key to Restaurant
    restaurantId: t.exposeString("restaurantId"),

    // Additional relations (not further defined here)
    restaurant: t.relation("restaurant"), // we do NOT define Restaurant object here
    gridConfig: t.relation("gridConfig", { nullable: true }), // do NOT define GridConfig object
    waitlists: t.relation("waitlists"),
    tables: t.relation("tables"),

    // Timestamps
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

/**
 * Query Fields for Area
 */
builder.queryFields((t) => ({
  /**
   * getArea
   * Fetch a single Area by "id". If not found, throw an error.
   */
  getArea: t.prismaField({
    type: "Area",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args) => {
      const area = await prisma.area.findUnique({
        ...query,
        where: { id: args.id },
      });
      if (!area) {
        throw new GraphQLError("Area not found");
      }
      return area;
    },
  }),

  /**
   * getAreas
   * Fetch all Area records in the database.
   * Optionally, you might want to paginate or filter; for now, we return all.
   */
  getAreas: t.prismaField({
    type: ["Area"],
    resolve: async (query) => {
      return prisma.area.findMany({ ...query });
    },
  }),

  /**
   * getChildAreas
   * Given an area "id", fetch its immediate children.
   */
  getChildAreas: t.prismaField({
    type: ["Area"],
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args) => {
      // Find areas whose parentId matches the given ID
      return prisma.area.findMany({
        ...query,
        where: { parentId: args.parentId },
      });
    },
  }),

  /**
   * getParentArea
   * Given an area "id", fetch its parent area (if any).
   */
  getParentArea: t.prismaField({
    type: "Area",
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args) => {
      const area = await prisma.area.findUnique({
        // We want to query the child area AND include its parent
        ...query,
        where: { id: args.id },
        include: {
          parent: true,
        },
      });
      return area?.parent ?? null;
    },
  }),
}));
