// =============================================================================
// EventCompass — Root Layout (product-neutral shell)
// SKO vs TechXchange chrome is selected in RouteChrome by pathname.
// =============================================================================

import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import RouteChrome from "@/components/layout/RouteChrome";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventCompass",
  description: "IBM event intelligence — TechXchange and sales enablement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
        style={{
          fontFamily:
            "var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif)",
        }}
      >
        <RouteChrome>{children}</RouteChrome>
      </body>
    </html>
  );
}
