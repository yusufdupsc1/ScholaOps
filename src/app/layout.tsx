// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";

const geistSans = localFont({
  src: "../assets/fonts/GeistLike-Regular.ttf",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../assets/fonts/GeistLike-Mono.ttf",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://scholaops1.vercel.app",
  ),
  title: {
    default: "scholaOps — Precision School Management",
    template: "%s | scholaOps",
  },
  description:
    "Professional-grade school operations platform. Precision engineered for administrative efficiency and institutional excellence.",
  keywords: [
    "school management system",
    "education ERP",
    "scholaOps",
    "academic administration",
    "school operations",
  ],
  authors: [{ name: "scholaOps" }],
  creator: "scholaOps",
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "scholaOps",
    title: "scholaOps — Modern Education Infrastructure",
    description: "The professional operations platform for forward-thinking schools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "scholaOps",
    description: "The professional operations platform for forward-thinking schools.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e11" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
