import { builder } from "../../builder";
import { NotificationPriorityEnum, NotificationStatusEnum } from "./enum";

builder.mutationField("addNotification", (t) =>
  t.prismaField({
    type: "Notification",
    args: {
      userEmail: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      message: t.arg.string({ required: true }),
      priority: t.arg({ type: NotificationPriorityEnum }),
      status: t.arg({ type: NotificationStatusEnum }),
    },
    resolve: (query, _root, args, ctx) => {
      return ctx.prisma.notification.create({
        ...query,
        data: {
          userEmail: args.userEmail,
          type: args.type,
          message: args.message,
          priority: args.priority ?? "NORMAL",
          status: args.status ?? "UNREAD",
        },
      });
    },
  })
);

builder.mutationField("updateNotification", (t) =>
  t.prismaField({
    type: "Notification",
    args: {
      id: t.arg.string({ required: true }),
      message: t.arg.string(),
      priority: t.arg({ type: NotificationPriorityEnum }),
      status: t.arg({ type: NotificationStatusEnum }),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, any> = {};
      if (typeof args.message === "string") data.message = args.message;
      if (args.priority) data.priority = args.priority;
      if (args.status) data.status = args.status;

      return ctx.prisma.notification.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  })
);

builder.mutationField("deleteNotification", (t) =>
  t.prismaField({
    type: "Notification",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      return ctx.prisma.notification.delete({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

builder.mutationField("markNotificationAsRead", (t) =>
  t.prismaField({
    type: "Notification",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      return ctx.prisma.notification.update({
        ...query,
        where: { id: args.id },
        data: { status: "READ" },
      });
    },
  })
);

/**
 * bulk mark all as read (יעיל בהרבה מלולאת קליינט)
 * מחזיר כמה רשומות עודכנו.
 */
builder.mutationField("markAllNotificationsAsRead", (t) =>
  t.field({
    type: "Int",
    args: {
      userEmail: t.arg.string({ required: true }),
      search: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const search = args.search?.trim();

      const result = await ctx.prisma.notification.updateMany({
        where: {
          userEmail: args.userEmail,
          status: "UNREAD",
          ...(search
            ? {
                OR: [
                  { type: { contains: search, mode: "insensitive" } },
                  { message: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        data: { status: "READ" },
      });

      return result.count;
    },
  })
);
