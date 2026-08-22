import en from './en';
import hi from './hi';
import mr from './mr';

export const STORAGE_KEY = 'vanraksha_language';
export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'languages.en' },
  { code: 'hi', labelKey: 'languages.hi' },
  { code: 'mr', labelKey: 'languages.mr' },
];

const messages = { en, hi, mr };

export function getStoredLocale() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && messages[stored]) return stored;
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale) {
  if (messages[locale]) {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function createTranslator(locale) {
  const catalog = messages[locale] || messages[DEFAULT_LOCALE];
  const fallback = messages[DEFAULT_LOCALE];

  return function t(key, params = {}) {
    let value = getNestedValue(catalog, key) ?? getNestedValue(fallback, key) ?? key;

    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
      return Object.entries(params).reduce(
        (str, [param, replacement]) => str.replace(`{{${param}}}`, String(replacement)),
        value
      );
    }

    return key;
  };
}

export function getMessages(locale) {
  return messages[locale] || messages[DEFAULT_LOCALE];
}
