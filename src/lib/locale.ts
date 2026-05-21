export type Locale = "en" | "ar" | "ru"

export const resolveLocale = (value?: string | null): Locale => {
  if (value === "ar") return "ar"
  if (value === "ru") return "ru"
  return "ru"
}

export const getDirection = (locale: Locale): "ltr" | "rtl" => "ltr"

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  ru: "Русский",
}
