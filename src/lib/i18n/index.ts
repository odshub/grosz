import { cookies } from "next/headers";
import { dictionaries, Locale, DictionaryKey } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeStr = cookieStore.get("locale")?.value as Locale;
  return dictionaries[localeStr] ? localeStr : "uk";
}

export async function getTranslation() {
  const locale = await getLocale();
  const dict = dictionaries[locale];

  return (key: DictionaryKey) => {
    return dict[key] || key;
  };
}

export function getTranslationSync(locale: Locale) {
  const dict = dictionaries[locale] || dictionaries["uk"];
  return (key: DictionaryKey) => {
    return dict[key] || key;
  };
}
