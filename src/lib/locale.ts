export type Locale = "en" | "ar"

export const resolveLocale = (value?: string | null): Locale => (value === "ar" ? "ar" : "en")

export const getDirection = (locale: Locale): "ltr" | "rtl" => (locale === "ar" ? "rtl" : "ltr")

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
}
