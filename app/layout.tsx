// =============================================================================
// Compass — Root Layout
// FORGE 2027 cinematic technology shell on /txc/* routes.
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./forge-cinematic.css";
import RouteChrome from "@/components/layout/RouteChrome";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Compass",
    template: "%s · Compass",
  },
  description: "FORGE 2027 — the builders' destination. Technology, people, and opportunity aligned by Compass.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Compass",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030308",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${jetbrainsMono.variable}`}
        style={{
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        }}
      >
        <RouteChrome>{children}</RouteChrome>
      </body>
    </html>
  );
}
