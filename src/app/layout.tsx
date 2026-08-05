import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grosz - Family Finance",
  description: "Minimalist mobile-first family finance tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Grosz",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

import { SplashScreen } from "@/components/SplashScreen";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <I18nProvider locale={locale}>
          <Providers>
            <SplashScreen />
            {children}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
