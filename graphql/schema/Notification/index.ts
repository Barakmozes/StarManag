import { builder } from "../../builder";
import { NotificationPriorityEnum, NotificationStatusEnum } from "./enum";

import "./queries";
import "./mutations";

builder.prismaObject("Notification", {
  fields: (t) => ({
    id: t.exposeID("id"),
    userEmail: t.exposeString("userEmail"),
    user: t.relation("user"),

    type: t.exposeString("type"),
    message: t.exposeString("message"),

    priority: t.expose("priority", { type: NotificationPriorityEnum }),
    status: t.expose("status", { type: NotificationStatusEnum }),

    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
