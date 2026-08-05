"use client";
import { createContext, useContext, ReactNode } from "react";
import { dictionaries, Locale, DictionaryKey } from "./dictionaries";

const I18nContext = createContext<Locale>("uk");

export function I18nProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <I18nContext.Provider value={locale}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const locale = useContext(I18nContext);
  const dict = dictionaries[locale] || dictionaries["uk"];

  const t = (key: DictionaryKey) => {
    return dict[key] || key;
  };

  return { t, locale };
}
