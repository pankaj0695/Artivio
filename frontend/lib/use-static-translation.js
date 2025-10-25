import { useLanguage } from "@/context/LanguageContext";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import mrMessages from "@/messages/mr.json";

const messages = {
  en: enMessages,
  hi: hiMessages,
  mr: mrMessages,
};

export function useStaticTranslation() {
  const { language } = useLanguage();
  
  // Get static i18n messages for current language
  const getStatic = (key) => {
    const keys = key.split(".");
    let value = messages[language || "en"];
    
    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return key; // Return key if path not found
      }
    }
    
    return typeof value === "string" ? value : key;
  };

  return { t: getStatic };
}
