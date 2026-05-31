const path = require("node:path");

const LOCALES = {
  zh: require(path.join(__dirname, "../locales/zh.json")),
  en: require(path.join(__dirname, "../locales/en.json"))
};

const SUPPORTED = Object.keys(LOCALES);

function normalizeLocale(locale) {
  if (!locale || typeof locale !== "string") {
    return "zh";
  }

  const value = locale.toLowerCase();

  if (value === "zh" || value === "en") {
    return value;
  }

  if (value.startsWith("zh")) {
    return "zh";
  }

  return "en";
}

function resolveLocale(preferred, systemLocale) {
  return normalizeLocale(preferred ?? systemLocale);
}

function getMessages(locale) {
  return LOCALES[normalizeLocale(locale)] ?? LOCALES.zh;
}

function t(locale, key, params = {}) {
  const parts = key.split(".");
  let value = getMessages(locale);

  for (const part of parts) {
    value = value?.[part];
  }

  if (typeof value !== "string") {
    return key;
  }

  return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

module.exports = {
  SUPPORTED,
  normalizeLocale,
  resolveLocale,
  getMessages,
  t
};
