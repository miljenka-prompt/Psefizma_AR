"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  availableLocales,
  DEFAULT_LOCALE,
  getCopy,
  hasDictionary,
  type Locale,
  type SiteCopy,
} from "@/lib/i18n";

const STORAGE_KEY = "psefizma-locale";

type I18nContextValue = {
  locale: Locale;
  copy: SiteCopy;
  availableLocales: ReadonlyArray<Locale>;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const requestedLocale = new URLSearchParams(window.location.search).get("lang");
    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    const initialLocale = hasDictionary(requestedLocale)
      ? requestedLocale
      : hasDictionary(storedLocale)
        ? storedLocale
        : DEFAULT_LOCALE;
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setLocaleState(initialLocale);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!hasDictionary(nextLocale)) return;

    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);

    const url = new URL(window.location.href);
    if (nextLocale === DEFAULT_LOCALE) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", nextLocale);
    }
    window.history.replaceState(null, "", url);
  }, []);

  const copy = getCopy(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.metadata.title;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", copy.metadata.description);
  }, [copy, locale]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, copy, availableLocales, setLocale }),
    [copy, locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSwitcher() {
  const { availableLocales: locales, copy, locale, setLocale } = useI18n();

  if (locales.length < 2) return null;

  return (
    <div className="language-switcher" role="group" aria-label={copy.languageSwitcherLabel}>
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          className={option === locale ? "is-active" : undefined}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          {getCopy(option).localeLabel}
        </button>
      ))}
    </div>
  );
}
