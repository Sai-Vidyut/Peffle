import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const siteUrl = "https://github.com/Sai-Vidyut/Peffle";
const title = "Peffle — local guard() for AI agent tool calls";
const description =
  "Apache-2.0 Node library that wraps agent tool calls in guard(): kill switch, JSON policy, transactional SQLite budgets, SHA-256 approvals, and an audit ledger. Local, zero telemetry.";

export const metadata: Metadata = {
  // No dedicated marketing domain yet — repo URL until a production origin exists.
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: [{ url: "/peffle-mascot-lg.png", type: "image/png" }],
    apple: [{ url: "/peffle-mascot-lg.png", type: "image/png" }],
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    images: [{ url: "/peffle-mascot-lg.png", alt: "Peffle mascot" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/peffle-mascot-lg.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>{children}</body>
    </html>
  );
}
