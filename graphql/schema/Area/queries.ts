// graphql/schema/Area/queries.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

const RESERVATION_DURATION_MINUTES =
  parseInt(process.env.RESERVATION_DURATION_MINUTES || "") || 120;

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
    restaurantId: t.exposeString("restaurantId", { nullable: true }),

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


// Example with Pothos builder
 const SortOrderEnum = builder.enumType("SortOrder", {
  values: ["asc", "desc"] as const,
});

 const AreaOrderByInput = builder.inputType("AreaOrderByInput", {
  fields: (t) => ({
    createdAt: t.field({ type: SortOrderEnum, required: false }),
    // ...other fields you want to allow sorting by
  }),
});
export const BasicArea = builder.objectRef<{
  name: string;
  floorPlanImage: string | null;
  id: string;
  createdAt:Date;
}>("BasicArea").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    floorPlanImage: t.exposeString("floorPlanImage", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

export const AreaAvailability = builder.objectRef<{
  id: string;
  name: string;
  description: string | null;
  floorPlanImage: string | null;
  totalTables: number;
  availableTables: number;
}>("AreaAvailability").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    floorPlanImage: t.exposeString("floorPlanImage", { nullable: true }),
    totalTables: t.exposeInt("totalTables"),
    availableTables: t.exposeInt("availableTables"),
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

  /**
   * getAreasNameDescription
   * Returns only the name & description of all Areas.
   */
  getAreasNameDescription: t.field({
    // We return an array of BasicArea objects (instead of full "Area").
    type: [BasicArea],
    args: {
      orderBy: t.arg({ type: AreaOrderByInput, required: false }),
    },
    resolve: async (_, { orderBy },) => {
      // Query only 'name' and 'description' from each row.
      return prisma.area.findMany({
           // 2) Pass 'orderBy' to Prisma if provided
           orderBy: orderBy
           ? {

               // For example, { createdAt: 'asc' }
               createdAt: orderBy.createdAt ?? undefined,
             }
           : undefined,
        select: {
          id: true,
          name: true,
          floorPlanImage: true,
          createdAt: true,
        },
      });
    },
  }),

  getAreasWithAvailability: t.field({
    type: [AreaAvailability],
    args: {
      date: t.arg.string({ required: true }),
      time: t.arg.string({ required: true }),
      numOfDiners: t.arg.int({ required: true }),
    },
    resolve: async (_, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in to check availability");
      }

      const requestedTime = new Date(`${args.date}T${args.time}:00`);
      if (isNaN(requestedTime.getTime())) {
        throw new GraphQLError("Invalid date or time format");
      }

      const restaurant = await prisma.restaurant.findFirst();
      if (restaurant) {
        validateOpeningHours(restaurant.openTimes, requestedTime);
      }

      const durationMs = RESERVATION_DURATION_MINUTES * 60 * 1000;
      const windowEnd = new Date(requestedTime.getTime() + durationMs);

      const areas = await prisma.area.findMany({
        include: {
          tables: {
            where: { diners: { gte: args.numOfDiners } },
            include: {
              reservations: {
                where: {
                  status: { in: ["PENDING", "CONFIRMED"] },
                  reservationTime: {
                    gt: new Date(requestedTime.getTime() - durationMs),
                    lt: windowEnd,
                  },
                },
                select: { id: true },
              },
            },
          },
        },
      });

      return areas.map((area) => {
        const totalTables = area.tables.length;
        const availableTables = area.tables.filter(
          (t) => t.reservations.length === 0
        ).length;
        return {
          id: area.id,
          name: area.name,
          description: area.description,
          floorPlanImage: area.floorPlanImage,
          totalTables,
          availableTables,
        };
      });
    },
  }),

}));
