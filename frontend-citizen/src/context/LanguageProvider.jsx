import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  createTranslator,
  getStoredLocale,
  setStoredLocale,
  SUPPORTED_LANGUAGES,
} from '../i18n/i18n';
import { LanguageContext } from './languageContext';

export default function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  const setLocale = useCallback((code) => {
    setStoredLocale(code);
    setLocaleState(code);
    document.documentElement.lang = code;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, languages: SUPPORTED_LANGUAGES }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
