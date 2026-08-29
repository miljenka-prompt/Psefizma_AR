import { hr } from "@/lib/i18n/locales/hr";
import {
  SUPPORTED_LOCALES,
  type Locale,
  type SiteCopy,
} from "@/lib/i18n/types";

export { SUPPORTED_LOCALES };
export type { Locale, SiteCopy };

export const DEFAULT_LOCALE: Locale = "hr";

// English is deliberately staged but not published yet. Add the reviewed
// `en` dictionary here to make the HR | EN switch appear automatically.
export const dictionaries: Partial<Record<Locale, SiteCopy>> = {
  hr,
};

export const availableLocales = SUPPORTED_LOCALES.filter(
  (locale) => dictionaries[locale] !== undefined,
);

export function hasDictionary(value: string | null): value is Locale {
  return value !== null && dictionaries[value as Locale] !== undefined;
}

export function getCopy(locale: Locale): SiteCopy {
  return dictionaries[locale] ?? hr;
}
