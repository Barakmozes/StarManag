import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import SchedulingDashboard from "./SchedulingDashboard";

export default async function SchedulingPage() {
  const user = await getCurrentUser();
  return <SchedulingDashboard user={user as User} />;
}
