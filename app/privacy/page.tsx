import Container from "@/app/components/Common/Container";
import Footer from "@/app/components/Common/Footer";
import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@prisma/client";

export default async function PrivacyPolicyPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <Header user={user as User} />
      <SideBar user={user as User} />

      <section className="pt-24 pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="mt-2 text-slate-600">A clear template you can tailor to your needs.</p>

            <div className="mt-10 space-y-8 rounded-2xl border bg-white p-7 shadow-sm">
              <section>
                <h2 className="text-lg font-semibold">1. Data we collect</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  Basic account details (like name/email), order-related details, and usage data
                  required to run and improve the service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">2. How we use data</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>Provide the service and authenticate users</li>
                  <li>Process and display orders</li>
                  <li>Improve reliability and security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold">3. Sharing</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  We share data only when needed to operate the service (e.g., restaurant fulfillment)
                  or to comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">4. Your choices</h2>
                <p className="mt-2 text-sm text-slate-700 leading-6">
                  You can update account details in your profile and request assistance through the
                  help center if needed.
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
