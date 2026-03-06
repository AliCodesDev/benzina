"use client";

import { DollarSign, Settings } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link, useRouter, usePathname } from "@/i18n/navigation";

export function Header() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: "en" | "ar") {
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-neutral-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-[var(--font-instrument-serif)] italic">
          Benzina
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Fuel prices">
            <Link href="/prices">
              <DollarSign className="size-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex size-8" asChild aria-label="Settings">
            <Link href="/settings">
              <Settings className="size-4" />
            </Link>
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            variant={locale === "en" ? "default" : "ghost"}
            size="sm"
            onClick={() => switchLocale("en")}
          >
            EN
          </Button>
          <Button
            variant={locale === "ar" ? "default" : "ghost"}
            size="sm"
            onClick={() => switchLocale("ar")}
          >
            ع
          </Button>
        </div>
      </div>
    </header>
  );
}
