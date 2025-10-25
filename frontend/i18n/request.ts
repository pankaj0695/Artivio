import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  // Default to 'en' if locale is undefined
  const resolvedLocale = locale || "en";
  return {
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
