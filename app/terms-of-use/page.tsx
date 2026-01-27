import Container from "@/app/components/Common/Container";
import Footer from "@/app/components/Common/Footer";
import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@prisma/client";

export default async function TermsOfUsePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <Header user={user as User} />
      <SideBar user={user as User} />

      <section className="pt-24 pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">Terms of Use</h1>
            <p className="mt-2 text-slate-600">A simple, clear template you can customize.</p>

            <div className="mt-10 space-y-8 rounded-2xl border bg-white p-7 shadow-sm">
              <section>
                <h2 className="text-lg font-semibold">1. Using the service</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  By using StarManag, you agree to use the platform responsibly, follow applicable
                  laws, and avoid misuse (spam, abuse, unauthorized access attempts, etc.).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">2. Accounts</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  You’re responsible for safeguarding your login and for activities under your
                  account. If you believe your account is compromised, stop usage and contact
                  support.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">3. Content & availability</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Menus, pricing, and availability are determined by restaurants/merchants. We may
                  update features, change UI, or perform maintenance as needed.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">4. Limitation of liability</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  This service is provided “as is”. To the fullest extent permitted by law, we’re
                  not liable for indirect or incidental damages.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">5. Updates</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Terms may be updated over time. Continued use means acceptance of updated terms.
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
