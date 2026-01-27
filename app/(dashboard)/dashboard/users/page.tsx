import React from "react";
import AdminUserTable from "./AdminUserTable";
import Container from "@/app/components/Common/Container";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

const AdminUsers = async () => {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const role = (user as any)?.role as string | undefined;

  // Allow ADMIN + MANAGER to view users page
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  return (
    <Container>
      <AdminUserTable
        currentUserId={(user as any)?.id ?? null}
        currentUserRole={role ?? null}
      />
    </Container>
  );
};

export default AdminUsers;
