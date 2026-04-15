import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const interBody = Inter({
  variable: "--font-body-var",
  subsets: ["latin"],
  display: "swap",
});

const interDisplay = Inter({
  variable: "--font-display-var",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://latejar.app"),
  title: {
    default: "Late Jar — meeting tardiness, donated to charity",
    template: "%s · Late Jar",
  },
  description:
    "We track your team's calendar and Meet attendance, calculate $1 per minute late, and route it to your chosen charity automatically. We take 10%, the charity gets the rest.",
  openGraph: {
    type: "website",
    url: "https://latejar.app",
    title: "Late Jar",
    description:
      "Late jar for meetings. Auto-donates to the cause your team picks.",
    siteName: "Late Jar",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Late Jar",
    description:
      "Late jar for meetings. Auto-donates to the cause your team picks.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfToken = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;
  return (
    <html
      lang="en"
      className={`${interBody.variable} ${interDisplay.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-bg text-fg">
        {children}
        {cfToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={`{"token": "${cfToken}"}`}
          />
        )}
      </body>
    </html>
  );
}
