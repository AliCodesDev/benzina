"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fuel } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import { cn } from "@/lib/utils";
import type { FuelType } from "@/types/station";

const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "95", label: "95" },
  { value: "98", label: "98" },
  { value: "diesel", label: "Diesel" },
  { value: "lpg", label: "LPG" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10] as const;

export function WelcomeModal() {
  const router = useRouter();
  const { hasCompletedOnboarding, setLocale, setPreferredFuels, setDefaultRadius, completeOnboarding } =
    usePreferencesStore();

  const [selectedLocale, setSelectedLocale] = useState<"en" | "ar">("en");
  const [selectedFuels, setSelectedFuels] = useState<FuelType[]>([]);
  const [selectedRadius, setSelectedRadius] = useState(5);

  if (hasCompletedOnboarding) return null;

  function toggleFuel(fuel: FuelType) {
    setSelectedFuels((prev) =>
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel]
    );
  }

  function handleSubmit() {
    setLocale(selectedLocale);
    setPreferredFuels(selectedFuels);
    setDefaultRadius(selectedRadius);
    completeOnboarding();

    if (selectedLocale === "ar") {
      router.push("/ar");
    }
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-sm"
      >
        <DialogHeader className="items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Fuel className="size-7 text-primary" />
          </div>
          <DialogTitle className="font-[family-name:var(--font-instrument-serif)] text-2xl italic">
            Welcome to Benzina
          </DialogTitle>
          <DialogDescription>
            Find the nearest gas station across all brands in Lebanon
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Language selection */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Language</legend>
            <div className="flex gap-2">
              {([
                { value: "en", label: "English" },
                { value: "ar", label: "العربية" },
              ] as const).map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setSelectedLocale(lang.value)}
                  className={cn(
                    "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    selectedLocale === lang.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Fuel type selection */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Preferred fuel type
            </legend>
            <div className="flex flex-wrap gap-2">
              {FUEL_OPTIONS.map((fuel) => (
                <button
                  key={fuel.value}
                  type="button"
                  onClick={() => toggleFuel(fuel.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    selectedFuels.includes(fuel.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {fuel.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Radius selection */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Default radius</legend>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => setSelectedRadius(radius)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    selectedRadius === radius
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <Button onClick={handleSubmit} className="mt-2 w-full" size="lg">
          Find Stations
        </Button>
      </DialogContent>
    </Dialog>
  );
}
