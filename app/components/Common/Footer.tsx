"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import FooterMobile from "./FooterMobile";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 bg-slate-950 text-slate-200">
      {/* Main footer */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <Image src="/img/logo.png" alt="StarManag" width={40} height={40} priority />
              </div>
              <div>
                <p className="text-lg font-semibold leading-tight">StarManag</p>
                <p className="text-sm text-slate-300">
                  Restaurant ordering & management — simple, fast, and modern.
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-300">
              Manage menus, orders, deliveries, and staff with a clean dashboard and a smooth user
              experience.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
              >
                Go to Home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/10"
              >
                Open Dashboard
              </Link>
            </div>

            <div className="mt-6 text-sm text-slate-400">
              <p>
                Need support?{" "}
                <Link href="/help" className="font-medium text-slate-200 hover:underline">
                  Help Center
                </Link>{" "}
                or{" "}
                <Link href="/contact-us" className="font-medium text-slate-200 hover:underline">
                  Contact Us
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white">PRODUCT</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/">
                      Explore Categories
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/cart">
                      Cart
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/user/favorites">
                      Favorites
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/user">
                      My Account
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white">SUPPORT</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/help">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/faqs">
                      FAQs
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/shipping">
                      Shipping & Delivery
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/contact-us">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white">LEGAL</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/terms-of-use">
                      Terms of Use
                    </Link>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/privacy">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <a
                      className="text-slate-300 hover:text-white"
                      href="https://github.com/Barakmozes/StarManag"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub Repo
                    </a>
                  </li>
                  <li>
                    <Link className="text-slate-300 hover:text-white" href="/login">
                      Login
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">
                Tip: If you’re a manager/admin, you can manage categories, menus, and restaurant
                settings from the{" "}
                <Link href="/dashboard/settings" className="font-medium text-white hover:underline">
                  Settings
                </Link>{" "}
                screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-400">
            © {year} StarManag. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <Link className="text-slate-400 hover:text-white" href="/privacy">
              Privacy
            </Link>
            <Link className="text-slate-400 hover:text-white" href="/terms-of-use">
              Terms
            </Link>
            <Link className="text-slate-400 hover:text-white" href="/shipping">
              Delivery
            </Link>
            <Link className="text-slate-400 hover:text-white" href="/contact-us">
              Contact
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <FooterMobile />

      {/* Spacer so the fixed mobile nav doesn't cover the last content */}
      <div className="h-24 md:hidden" />
    </footer>
  );
};

export default Footer;
