import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const description =
  "Compare fictional UAE car insurance plans side by side. Answer a few questions, filter and sort the results, and compare up to three plans.";

export const metadata: Metadata = {
  title: {
    default: "Compass Cover | Compare car insurance quotes in minutes",
    template: "%s | Compass Cover",
  },
  description,
  applicationName: "Compass Cover",
  openGraph: {
    type: "website",
    siteName: "Compass Cover",
    title: "Compass Cover | Compare car insurance quotes in minutes",
    description,
    locale: "en_AE",
  },
  twitter: { card: "summary", title: "Compass Cover", description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a111f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script may add the "dark" class before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
