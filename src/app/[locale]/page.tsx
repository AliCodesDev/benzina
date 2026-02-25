import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">{t("appName")}</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        {t("tagline")}
      </p>
    </div>
  );
}
