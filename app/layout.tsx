// =============================================================================
// Compass — Root Layout (product-neutral shell)
// FORGE 2027 demo chrome is selected in RouteChrome by pathname.
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import RouteChrome from "@/components/layout/RouteChrome";

const inter = Inter({
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
  description: "AI-powered event intelligence — sessions, guides, communities, and your personalized journey.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Compass",
    statusBarStyle: "default",
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
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable}`}
        style={{
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        }}
      >
        <RouteChrome>{children}</RouteChrome>
      </body>
    </html>
  );
}
