import { useEffect, useMemo, useState } from 'react'
import {
  LANGUAGE_STORAGE_KEY,
  getStoredLanguage,
  normalizeLanguage,
  setStoredLanguage,
  translate,
} from '../i18n/translations'

export function useAppLanguage() {
  const [language, setLanguageState] = useState(getStoredLanguage)

  useEffect(() => {
    function handleLanguageChange(event) {
      const nextLanguage = normalizeLanguage(event?.detail?.language)
      setLanguageState(nextLanguage)
    }

    function handleStorageChange(event) {
      if (event.key !== LANGUAGE_STORAGE_KEY) return
      setLanguageState(getStoredLanguage())
    }

    window.addEventListener('vanraksha-language-change', handleLanguageChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('vanraksha-language-change', handleLanguageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const setLanguage = (nextLanguage) => {
    const normalizedLanguage = setStoredLanguage(nextLanguage)
    setLanguageState(normalizedLanguage)
  }

  const t = useMemo(() => (key) => translate(language, key), [language])

  return {
    language,
    setLanguage,
    t,
  }
}
