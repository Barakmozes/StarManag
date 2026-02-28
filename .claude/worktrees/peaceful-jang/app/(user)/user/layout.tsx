import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import UserLayoutShell from "./UserLayoutShell";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return <UserLayoutShell user={user as User}>{children}</UserLayoutShell>;
}
