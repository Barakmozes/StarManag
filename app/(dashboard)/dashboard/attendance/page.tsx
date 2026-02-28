import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import AttendanceDashboard from "./AttendanceDashboard";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  return <AttendanceDashboard user={user as User} />;
}
