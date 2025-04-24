/**
 * app/layout.tsx
 *
 * Demonstrates:
 * - SSR locale fallback (via cookies) → <html lang="..." dir="...">
 * - Google Translate scripts for instant translation
 * - Hidden widget + custom TranslateToggle button
 * - Using environment variables (e.g. GRAPHQL_API_KEY) in Next.js 14
 */

import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";

import Providers from "./Providers";
import EntryFullscreenModal from "./components/Home/EntryFullscreenModal";
// Import the client component for toggling languages
import TranslateToggle from "./components/Common/TranslateToggle";

export const metadata: Metadata = {
  title: "StarManag – Smart Restaurant Management System and Food Delivery",
  description: "food delivery app",
};

// Helper function to read the 'locale' cookie on the server, defaulting to 'en'
function getServerLocale() {
  const cookieStore = cookies();
  return cookieStore.get("locale")?.value || "en";
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR fallback: read the 'locale' cookie or default to English
  const currentLocale = getServerLocale();
  const isHebrew = currentLocale === "he";

  // Set <html lang="he" dir="rtl"> for Hebrew, else <html lang="en" dir="ltr">
  const htmlLang = isHebrew ? "he" : "en";
  const htmlDir = isHebrew ? "rtl" : "ltr";

  // Example environment variable usage
  const graphqlApiKey = process.env.GRAPHQL_API_KEY || "";

  return (
    <html lang={htmlLang} dir={htmlDir}>
      <head>
        {/* 
          1) googleTranslateElementInit(): defines how the translator widget is created.
          2) Google script: loads the library from google.com.
        */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,he',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <Script
          id="google-translate-script"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />

        {/* Optionally hide the widget if you don't want Google's default dropdown visible */}
        <style>{`
          #google_translate_element {
            display: none;
          }
        `}</style>
      </head>
      <body className="min-h-screen bg-white text-black">
        {/* 
          Next.js automatically includes <!DOCTYPE html> to avoid Quirks Mode.
          Do not add extra DOCTYPE anywhere else.
        */}

        {/* Show a modal before anything else, if desired */}
        <EntryFullscreenModal />

        {/* The hidden div where Google injects its widget. Required even if hidden. */}
        <div id="google_translate_element" />

        {/* 
          Wrap everything in global providers, 
          e.g. Redux, Zustand, or any other app-wide contexts.
        */}
        <Providers graphqlApiKey={graphqlApiKey}>
          {/* Our custom button that triggers Google Translate to "en|he" instantly */}
          <TranslateToggle currentLocale={currentLocale} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
