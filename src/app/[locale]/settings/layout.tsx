import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Benzina",
  description:
    "Customize your Benzina experience. Set your preferred language, fuel types, search radius, currency display, and theme.",
  openGraph: {
    title: "Settings - Benzina",
    description:
      "Customize your Benzina experience. Set your preferred language, fuel types, search radius, and more.",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
