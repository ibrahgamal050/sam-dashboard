"use client"

import { useCallback, useMemo, useState } from "react"

import { dictionaries, type SupportedLanguage, type TranslationKey } from "@/i18n"

function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return "en"
  const language = navigator.language?.toLowerCase?.() ?? "en"
  return language.startsWith("ar") ? "ar" : "en"
}

export function useI18n(initialLanguage?: SupportedLanguage) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage ?? detectBrowserLanguage())

  const dictionary = useMemo(() => {
    return dictionaries[language] ?? dictionaries.en
  }, [language])

  const t = useCallback(
    (key: TranslationKey) => {
      return dictionary[key] ?? dictionaries.en[key] ?? key
    },
    [dictionary],
  )

  return {
    t,
    language,
    setLanguage,
    dictionary,
  }
}
