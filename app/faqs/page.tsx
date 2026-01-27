import Container from "@/app/components/Common/Container";
import Footer from "@/app/components/Common/Footer";
import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@prisma/client";
import Link from "next/link";

const FaqItem = ({ q, a }: { q: string; a: React.ReactNode }) => (
  <details className="group rounded-2xl border bg-white p-5 shadow-sm">
    <summary className="cursor-pointer list-none font-semibold text-slate-900">
      <span className="flex items-center justify-between">
        {q}
        <span className="ml-4 rounded-full border px-2 py-0.5 text-xs text-slate-500 group-open:hidden">
          +
        </span>
        <span className="ml-4 rounded-full border px-2 py-0.5 text-xs text-slate-500 hidden group-open:inline">
          –
        </span>
      </span>
    </summary>
    <div className="mt-3 text-sm text-slate-700 leading-6">{a}</div>
  </details>
);

export default async function FaqsPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <Header user={user as User} />
      <SideBar user={user as User} />

      <section className="pt-24 pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">FAQs</h1>
            <p className="mt-2 text-slate-600">Common questions and clear answers.</p>

            <div className="mt-10 space-y-4">
              <FaqItem
                q="Where can I see my orders?"
                a={
                  <>
                    Go to{" "}
                    <Link href="/user/orders" className="font-semibold hover:underline">
                      My Orders
                    </Link>{" "}
                    (requires login).
                  </>
                }
              />
              <FaqItem
                q="How do I add items to favorites?"
                a={
                  <>
                    Open any menu item and click the favorite button. View them in{" "}
                    <Link href="/user/favorites" className="font-semibold hover:underline">
                      Favorites
                    </Link>
                    .
                  </>
                }
              />
              <FaqItem
                q="I’m a manager/admin — where do I manage menus and categories?"
                a={
                  <>
                    Use the{" "}
                    <Link href="/dashboard" className="font-semibold hover:underline">
                      Dashboard
                    </Link>{" "}
                    and go to{" "}
                    <Link href="/dashboard/settings" className="font-semibold hover:underline">
                      Settings
                    </Link>
                    .
                  </>
                }
              />
              <FaqItem
                q="What if I need support?"
                a={
                  <>
                    Start from the{" "}
                    <Link href="/help" className="font-semibold hover:underline">
                      Help Center
                    </Link>{" "}
                    or{" "}
                    <Link href="/contact-us" className="font-semibold hover:underline">
                      Contact Us
                    </Link>
                    .
                  </>
                }
              />
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
