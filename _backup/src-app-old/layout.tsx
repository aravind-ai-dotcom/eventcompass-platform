// =============================================================================
// EventCompass — Root Layout
//
// - IBM Plex Sans + IBM Plex Mono via next/font (zero layout shift)
// - data-theme="dark" on <html> — CompassHeader toggles it client-side
// - CompassHeader (sticky nav, theme switch, CTA)
// - CompassFooter
// - globals.css design system
// - <main className="compass-main"> provides the max-width container
//   so individual pages don't need to repeat it
// =============================================================================

import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import CompassHeader from "@/components/layout/CompassHeader";
import CompassFooter from "@/components/layout/CompassFooter";

// IBM Plex Sans — primary typeface for all body, headings, nav, buttons
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// IBM Plex Mono — time/date, session IDs, kicker numbers, code
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Compass | IBM TechXchange 2026",
  description:
    "AI-powered event intelligence. Find your sessions, people, and opportunities at IBM TechXchange.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
        style={{
          fontFamily:
            "var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif)",
        }}
      >
        <CompassHeader />
        {/*
          compass-main sets width: min(1180px, calc(100% - 40px)) and centers
          the content — defined in globals.css. Pages render inside this
          container and do not need their own max-width wrapper.
        */}
        <main className="compass-main">{children}</main>
        <CompassFooter />
      </body>
    </html>
  );
}
