import Container from "@/app/components/Common/Container";
import Footer from "@/app/components/Common/Footer";
import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@prisma/client";
import Link from "next/link";

export default async function HelpPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <Header user={user as User} />
      <SideBar user={user as User} />

      <section className="pt-24 pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">Help Center</h1>
            <p className="mt-2 text-slate-600">
              Quick answers, common fixes, and where to go when you need support.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <Link
                href="/faqs"
                className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <h2 className="font-semibold">FAQs</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Most common questions about orders, accounts, and dashboard usage.
                </p>
              </Link>

              <Link
                href="/contact-us"
                className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <h2 className="font-semibold">Contact Us</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Not finding what you need? Reach out and we’ll help.
                </p>
              </Link>

              <Link
                href="/shipping"
                className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <h2 className="font-semibold">Shipping & Delivery</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Delivery windows, address issues, delays, and status updates.
                </p>
              </Link>

              <Link
                href="/terms-of-use"
                className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <h2 className="font-semibold">Terms & Policies</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Privacy, terms of use, and general policies.
                </p>
              </Link>
            </div>

            <div className="mt-10 rounded-2xl border bg-slate-50 p-6">
              <p className="text-sm text-slate-700">
                Need to submit a request? If you’re logged in, you can use the in-app form at{" "}
                <Link href="/user/help" className="font-semibold hover:underline">
                  /user/help
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
