import Container from "@/app/components/Common/Container";
import Footer from "@/app/components/Common/Footer";
import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@prisma/client";
import Link from "next/link";

export default async function ShippingPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <Header user={user as User} />
      <SideBar user={user as User} />

      <section className="pt-24 pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">Shipping & Delivery</h1>
            <p className="mt-2 text-slate-600">
              General delivery policy template (customize per restaurant/merchant).
            </p>

            <div className="mt-10 space-y-8 rounded-2xl border bg-white p-7 shadow-sm">
              <section>
                <h2 className="text-lg font-semibold">Delivery windows</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Estimated delivery times vary by distance, load, and availability. You’ll see the
                  latest status in your order view.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">Address issues</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Please ensure your address and phone details are correct. If a driver cannot reach
                  you, delivery may be delayed or canceled depending on the merchant policy.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">Order status</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Track your order at{" "}
                  <Link href="/user/orders" className="font-semibold hover:underline">
                    My Orders
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">Need help?</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Visit the{" "}
                  <Link href="/help" className="font-semibold hover:underline">
                    Help Center
                  </Link>{" "}
                  or{" "}
                  <Link href="/contact-us" className="font-semibold hover:underline">
                    Contact Us
                  </Link>
                  .
                </p>
              </section>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
