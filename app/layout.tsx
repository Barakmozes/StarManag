import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import Providers from "./Providers";
import "./globals.css";

// פונטים: Inter לטקסט רגיל ו-Playfair לכותרות (מתאים ל-ModernWaveHeading)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "StarManag – מערכת ניהול מסעדות חכמה",
    template: "%s | StarManag",
  },
  description: "הפתרון המושלם לניהול מסעדות, הזמנות ומשלוחי אוכל בזמן אמת.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16a34a", // ירוק התואם למותג שלך
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${playfair.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full font-sans antialiased bg-white text-slate-900 selection:bg-green-100 selection:text-green-900">
        <Providers>
          {/* שימוש ב-Main כדי להבטיח נגישות ומבנה סמנטי */}
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
