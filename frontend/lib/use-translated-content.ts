import { useEffect, useState } from "react";

type Language = "en" | "hi" | "mr";

const LANGUAGE_MAP: Record<Language, string> = {
  en: "en",
  hi: "hi-IN",
  mr: "mr-IN",
};

const CACHE_KEY_PREFIX = "translation_cache_";

interface TranslationResult {
  translated: string;
  loading: boolean;
}

export const useTranslatedContent = (
  text: string | undefined,
  targetLang: Language
): TranslationResult => {
  const [translated, setTranslated] = useState<string>(text || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text || targetLang === "en") {
      setTranslated(text || "");
      return;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${text}_${targetLang}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setTranslated(cached);
      return;
    }

    setLoading(true);

    const translateText = async () => {
      try {
        const langPair = `en|${LANGUAGE_MAP[targetLang]}`;
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
        );

        if (!response.ok) throw new Error("Translation API failed");

        const data = await response.json();

        if (data.responseStatus === 200) {
          const translatedText = data.responseData.translatedText;
          localStorage.setItem(cacheKey, translatedText);
          setTranslated(translatedText);
        } else {
          setTranslated(text); // fallback to original text
        }
      } catch (error) {
        console.error("Translation error:", error);
        setTranslated(text); // fallback to original text
      } finally {
        setLoading(false);
      }
    };

    translateText();
  }, [text, targetLang]);

  return { translated, loading };
};
