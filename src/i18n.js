import zh from "../locales/zh.json";
import en from "../locales/en.json";

const MESSAGES = { zh, en };

let locale = "zh";

function normalizeLocale(value) {
  if (!value || typeof value !== "string") {
    return "zh";
  }

  const lower = value.toLowerCase();

  if (lower === "zh" || lower === "en") {
    return lower;
  }

  if (lower.startsWith("zh")) {
    return "zh";
  }

  return "en";
}

function detectBrowserLocale() {
  return normalizeLocale(navigator.language);
}

export function getLocale() {
  return locale;
}

export function getMessages() {
  return MESSAGES[locale] ?? MESSAGES.zh;
}

export function t(key, params = {}) {
  const parts = key.split(".");
  let value = getMessages();

  for (const part of parts) {
    value = value?.[part];
  }

  if (typeof value !== "string") {
    return key;
  }

  return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export function pickSpeechLine() {
  const lines = getMessages().speech?.lines ?? [];

  if (!lines.length) {
    return "";
  }

  return lines[Math.floor(Math.random() * lines.length)];
}

function applyDocumentLocale() {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.title = t("app.title");
}

export async function initI18n() {
  const api = window.kuromiDesktopPet;

  if (api?.getLocale) {
    locale = normalizeLocale(await api.getLocale());
  } else {
    locale = detectBrowserLocale();
  }

  applyDocumentLocale();

  api?.onLocaleChanged?.((next) => {
    locale = normalizeLocale(next);
    applyDocumentLocale();
  });
}
