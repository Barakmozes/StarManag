import Container from "@/app/components/Common/Container";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import NotificationsList, {
  NotificationDTO,
  NotificationFilters,
} from "./NotificationsList";

export const dynamic = "force-dynamic";

function getString(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const v = searchParams?.[key];
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

function clampTake(input: number, def = 80) {
  const n = Number.isFinite(input) ? input : def;
  return Math.min(Math.max(n, 20), 200);
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();
  const userEmail = user?.email ?? "";

  if (!userEmail) {
    return (
      <Container>
        <div className="rounded-lg shadow-2xl p-6 my-12 bg-white">
          <h1 className="text-xl font-semibold text-center">Notifications</h1>
          <p className="text-slate-500 text-center mt-3">
            כדי לראות התראות יש להתחבר למערכת.
          </p>
        </div>
      </Container>
    );
  }

  const q = getString(searchParams, "q").trim();
  const statusRaw = getString(searchParams, "status").trim().toUpperCase();
  const takeRaw = parseInt(getString(searchParams, "take") || "80", 10);

  const status: NotificationFilters["status"] =
    statusRaw === "READ" ? "READ" : statusRaw === "UNREAD" ? "UNREAD" : "ALL";

  const take = clampTake(takeRaw, 80);

  const where: any = {
    userEmail,
    ...(status !== "ALL" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { type: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // טריק ביצועים: מביאים take+1 כדי לדעת אם יש עוד
  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const list = rows.slice(0, take);

  const initialNotifications: NotificationDTO[] = list.map((n) => ({
    id: n.id,
    userEmail: n.userEmail,
    type: n.type,
    message: n.message,
    status: n.status as any,
    priority: n.priority as any,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  const filters: NotificationFilters = {
    q,
    status,
    take,
  };

  return (
    <Container>
      <div className="rounded-lg shadow-2xl p-6 my-12 bg-white">
        <NotificationsList
          userEmail={userEmail}
          initialNotifications={initialNotifications}
          filters={filters}
          hasMore={hasMore}
        />
      </div>
    </Container>
  );
}
