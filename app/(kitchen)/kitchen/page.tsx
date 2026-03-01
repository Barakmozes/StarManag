import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import KitchenDisplay from "./KitchenDisplay";

export default async function KitchenPage() {
  const user = await getCurrentUser();
  return <KitchenDisplay user={user as User} />;
}
