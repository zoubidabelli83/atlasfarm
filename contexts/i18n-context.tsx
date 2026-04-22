"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Locale } from "@/lib/translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isRTL: boolean;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
  isRTL: false,
  dir: "ltr",
});

export function I18nProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLang ?? "fr");

  useEffect(() => {
    const saved = localStorage.getItem("atlasfarm-locale") as Locale | null;
    if (saved && ["en", "fr", "ar"].includes(saved)) {
      setLocaleState(saved);
    } else if (initialLang) {
      setLocaleState(initialLang);
    }
  }, [initialLang]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("atlasfarm-locale", newLocale);
  };

  const t = (key: string): string => {
    return translations[locale][key] || translations["en"][key] || key;
  };

  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL, dir }}>
      <div dir={dir} className={isRTL ? "font-arabic" : ""}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
