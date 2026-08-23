import { useTranslation } from '../../hooks/useTranslation';
import './HeaderLanguagePicker.css';

const SHORT_LABELS = {
  en: 'EN',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

export default function HeaderLanguagePicker({ compact = true }) {
  const { t, locale, setLocale, languages } = useTranslation();

  return (
    <div
      className={`header-lang ${compact ? 'header-lang--compact' : ''}`}
      role="group"
      aria-label={t('languages.title')}
    >
      {languages.map(({ code }) => (
        <button
          key={code}
          type="button"
          className={`header-lang__option ${
            locale === code ? 'header-lang__option--active' : ''
          }`}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          aria-label={t(`languages.${code}`)}
        >
          {SHORT_LABELS[code] || code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
