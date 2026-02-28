import { builder } from "../../builder";
import { NotificationStatusEnum } from "./enum";

function clampTake(take?: number | null) {
  const n = typeof take === "number" ? take : 50;
  return Math.min(Math.max(n, 1), 200);
}

builder.queryField("getNotification", (t) =>
  t.prismaField({
    type: "Notification",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      return ctx.prisma.notification.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

/**
 * Admin-ish / general list
 * נשאר תואם לקוד קיים: אפשר לקרוא בלי args (כי כולם אופציונליים)
 */
builder.queryField("getNotifications", (t) =>
  t.prismaField({
    type: ["Notification"],
    args: {
      userEmail: t.arg.string(),
      search: t.arg.string(),
      status: t.arg({ type: NotificationStatusEnum }),
      take: t.arg.int(),
      skip: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) => {
      const search = args.search?.trim();
      const take = clampTake(args.take);
      const skip = args.skip ?? 0;

      return ctx.prisma.notification.findMany({
        ...query,
        where: {
          ...(args.userEmail ? { userEmail: args.userEmail } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(search
            ? {
                OR: [
                  { type: { contains: search, mode: "insensitive" } },
                  { message: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
  })
);

/**
 * User list
 * userEmail חובה, השאר אופציונלי
 */
builder.queryField("getUserNotifications", (t) =>
  t.prismaField({
    type: ["Notification"],
    args: {
      userEmail: t.arg.string({ required: true }),
      search: t.arg.string(),
      status: t.arg({ type: NotificationStatusEnum }),
      take: t.arg.int(),
      skip: t.arg.int(),
    },
    resolve: (query, _root, args, ctx) => {
      const search = args.search?.trim();
      const take = clampTake(args.take);
      const skip = args.skip ?? 0;

      return ctx.prisma.notification.findMany({
        ...query,
        where: {
          userEmail: args.userEmail,
          ...(args.status ? { status: args.status } : {}),
          ...(search
            ? {
                OR: [
                  { type: { contains: search, mode: "insensitive" } },
                  { message: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
  })
);

/**
 * שיפור ביצועים ל-NotifyDropDown:
 * badge אמיתי בלי למשוך את כל הרשימה.
 */
builder.queryField("getUnreadNotificationsCount", (t) =>
  t.field({
    type: "Int",
    args: {
      userEmail: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ctx.prisma.notification.count({
        where: {
          userEmail: args.userEmail,
          status: "UNREAD",
        },
      });
    },
  })
);
