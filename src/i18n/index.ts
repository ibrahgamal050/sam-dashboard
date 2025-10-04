import { ar } from "./ar"
import { en } from "./en"

export const dictionaries = {
  en,
  ar,
}

export type SupportedLanguage = keyof typeof dictionaries
export type TranslationKey = keyof typeof en

export function getDictionary(language: SupportedLanguage) {
  return dictionaries[language] ?? en
}

export function translate(language: SupportedLanguage, key: TranslationKey): string {
  const dict = getDictionary(language)
  return dict[key] ?? key
}
