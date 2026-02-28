import Container from "@/app/components/Common/Container";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

import RestaurantSettings from "./RestaurantSettings";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    redirect("/");
  }

  return (
    <Container>
      <RestaurantSettings />
    </Container>
  );
}
