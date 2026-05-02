import ja from "@/locales/ja.json";

type Messages = typeof ja;
type TranslationResult = {
  t: Messages;
  locale: "ja";
  messages: Messages;
};

export function getTranslations(): TranslationResult {
  return {
    t: ja,
    locale: "ja",
    messages: ja
  };
}

// Client Component alias kept to match the requirement-level useTranslation API.
export function useTranslation(): TranslationResult {
  return getTranslations();
}
