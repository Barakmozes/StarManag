import Container from "@/app/components/Common/Container";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminOrderTable from "./AdminOrderTable";

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    redirect("/");
  }

  return (
    <Container>
      <AdminOrderTable />
    </Container>
  );
}
