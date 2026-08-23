import { Globe } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './AuthLanguagePicker.css';

export default function AuthLanguagePicker() {
  const { t, locale, setLocale, languages } = useTranslation();

  return (
    <div className="auth-language-picker">
      <div className="auth-language-picker__label">
        <Globe size={16} />
        <span>{t('languages.title')}</span>
      </div>
      <div className="auth-language-picker__options">
        {languages.map(({ code, labelKey }) => (
          <button
            key={code}
            type="button"
            className={`auth-language-picker__option ${
              locale === code ? 'auth-language-picker__option--active' : ''
            }`}
            onClick={() => setLocale(code)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
