"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="text-xl font-[var(--font-instrument-serif)] italic">
          Benzina
        </span>

        <div className="flex gap-1">
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
