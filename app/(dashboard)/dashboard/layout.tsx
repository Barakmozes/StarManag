import { getCurrentUser } from "@/lib/session";
import DashWrapper from "./Components/DashWrapper";
import { User } from "@prisma/client";
import Providers from "@/app/Providers";


type DashLayoutProps = {
  children: React.ReactNode;
};
  const graphqlApiKey = process.env.GRAPHQL_API_KEY as string;

export default async function DashboardLayout({ children }: DashLayoutProps) {
  const user = await getCurrentUser()
  return<Providers graphqlApiKey={graphqlApiKey}> <DashWrapper user={user as User}>{children}</DashWrapper></Providers>;
}
