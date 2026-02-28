import Container from "@/app/components/Common/Container";
import Footer from "@/app/components/Common/Footer";
import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@prisma/client";
import Link from "next/link";

export default async function ContactUsPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <Header user={user as User} />
      <SideBar user={user as User} />

      <section className="pt-24 pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="mt-2 text-slate-600">
              Choose the fastest option below and we’ll get back to you.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="font-semibold">Help Center</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Start with FAQs and quick troubleshooting.
                </p>
                <Link
                  href="/help"
                  className="mt-4 inline-flex text-sm font-semibold text-green-700 hover:underline"
                >
                  Open Help Center →
                </Link>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="font-semibold">Submit a Request (in-app)</h2>
                <p className="mt-2 text-sm text-slate-600">
                  If you’re logged in, use the request form for the best tracking.
                </p>
                <Link
                  href="/user/help"
                  className="mt-4 inline-flex text-sm font-semibold text-green-700 hover:underline"
                >
                  Go to Request Form →
                </Link>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border bg-slate-50 p-6">
              <h3 className="font-semibold">What to include</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                <li>What you were trying to do</li>
                <li>What happened instead (error message if any)</li>
                <li>Device + browser (Chrome/Edge/Safari etc.)</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
