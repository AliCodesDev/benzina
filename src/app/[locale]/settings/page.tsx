"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import { cn } from "@/lib/utils";
import type { FuelType } from "@/types/station";

const FUEL_OPTIONS: FuelType[] = ["95", "98", "diesel", "lpg"];
const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;

export default function SettingsPage() {
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("settings");
  const tFuel = useTranslations("fuel");
  const {
    preferredFuels,
    defaultRadius,
    currency,
    theme,
    setLocale,
    setPreferredFuels,
    setDefaultRadius,
    setCurrency,
    setTheme,
  } = usePreferencesStore();

  function handleLocaleChange(locale: "en" | "ar") {
    setLocale(locale);
    router.push(`/${locale}/settings`);
  }

  function toggleFuel(fuel: FuelType) {
    const next = preferredFuels.includes(fuel)
      ? preferredFuels.filter((f) => f !== fuel)
      : [...preferredFuels, fuel];
    setPreferredFuels(next);
  }

  function handleReset() {
    localStorage.removeItem("benzina-preferences");
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-6">
      <h1 className="text-2xl font-[family-name:var(--font-instrument-serif)] italic">
        {t("title")}
      </h1>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([
              { value: "en", label: "English" },
              { value: "ar", label: "العربية" },
            ] as const).map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => handleLocaleChange(lang.value)}
                className={cn(
                  "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  currentLocale === lang.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fuel & Radius */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("searchPreferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("fuelPreference")}</Label>
            <div className="flex flex-wrap gap-2">
              {FUEL_OPTIONS.map((fuel) => (
                <button
                  key={fuel}
                  type="button"
                  onClick={() => toggleFuel(fuel)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    preferredFuels.includes(fuel)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {tFuel(fuel)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("defaultRadius")}</Label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => setDefaultRadius(radius)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    defaultRadius === radius
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("display")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("currency")}</Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as "LBP" | "USD" | "both")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LBP">LBP</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="both">{t("currencyBoth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label>{t("theme")}</Label>
            <Select
              value={theme}
              onValueChange={(v) =>
                setTheme(v as "light" | "dark" | "system")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("themeLight")}</SelectItem>
                <SelectItem value="dark">{t("themeDark")}</SelectItem>
                <SelectItem value="system">{t("themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reset */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={handleReset}
      >
        <RotateCcw className="size-4" />
        {t("resetPreferences")}
      </Button>

      {/* About */}
      <div className="space-y-2 border-t pt-6 text-center text-sm text-muted-foreground">
        <p className="font-[family-name:var(--font-instrument-serif)] text-base italic text-foreground">
          {t("version")}
        </p>
        <p>{t("dataSource")}</p>
        <a
          href="https://github.com/nicolo/benzina"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
        >
          {t("viewOnGithub")}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
