import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import BarDisplay from "./BarDisplay";

export default async function BarPage() {
  const user = await getCurrentUser();
  return <BarDisplay user={user as User} />;
}
