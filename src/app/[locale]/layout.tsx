import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {
  DM_Sans,
  IBM_Plex_Sans_Arabic,
  Instrument_Serif,
} from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { PriceTicker } from "@/components/prices/price-ticker";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { routing } from "@/i18n/routing";
import "mapbox-gl/dist/mapbox-gl.css";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-ibm-plex-arabic",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Benzina - Gas Station Finder Lebanon",
    default: "Benzina - Gas Station Finder Lebanon",
  },
  description:
    "Find the nearest gas station across all brands in Lebanon. Compare fuel prices, get directions, and check station details.",
  keywords: [
    "gas station",
    "lebanon",
    "fuel",
    "benzine",
    "petrol",
    "diesel",
    "fuel prices",
    "بنزين",
    "محطة وقود",
    "لبنان",
  ],
  openGraph: {
    type: "website",
    siteName: "Benzina",
    title: "Benzina - Gas Station Finder Lebanon",
    description:
      "Find the nearest gas station across all brands in Lebanon. Compare fuel prices, get directions, and check station details.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benzina - Gas Station Finder Lebanon",
    description:
      "Find the nearest gas station across all brands in Lebanon. Compare fuel prices and get directions.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isArabic = locale === "ar";
  const fontClass = isArabic ? ibmPlexArabic.variable : dmSans.variable;

  return (
    <html lang={locale} dir={isArabic ? "rtl" : "ltr"}>
      <body
        className={`${fontClass} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider>
          <ThemeProvider>
            <WelcomeModal />
            <PriceTicker />
            <Header />
            {children}
            <BottomNav />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
