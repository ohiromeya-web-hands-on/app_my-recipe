import ja from "@/locales/ja.json";

type Messages = typeof ja;

export function useTranslation() {
  return {
    t: ja,
    locale: "ja",
    messages: ja satisfies Messages
  };
}
