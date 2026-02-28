import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import UserReservations from "./UserReservations";

export default async function ReservationsPage() {
  const user = await getCurrentUser();
  return <UserReservations user={user as User} />;
}
