import { FileUp } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { formatFieldError } from '../../utils/i18nHelpers';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  validateDocument,
} from '../../utils/registrationValidation';
import './DocumentUpload.css';

export default function DocumentUpload({
  label,
  file,
  onChange,
  error,
  fieldName,
  labelKey,
}) {
  const { t } = useTranslation();

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    onChange(selected, fieldName);
    event.target.value = '';
  };

  const validationError = file ? validateDocument(file, labelKey) : null;
  const displayError = error ? formatFieldError(t, error) : formatFieldError(t, validationError);

  return (
    <div className="document-upload">
      <span className="document-upload__label">{label}</span>
      <label
        className={`document-upload__box ${displayError ? 'document-upload__box--error' : ''}`}
      >
        <input
          type="file"
          accept={ALLOWED_DOCUMENT_EXTENSIONS}
          onChange={handleFileChange}
        />
        <FileUp size={20} className="document-upload__icon" />
        <div className="document-upload__text">
          {file ? (
            <span className="document-upload__filename">{file.name}</span>
          ) : (
            <>
              <div className="document-upload__action">{t('common.chooseFile')}</div>
              <div className="document-upload__hint">{t('registration.documentHint')}</div>
            </>
          )}
        </div>
      </label>
      {displayError && <span className="document-upload__error">{displayError}</span>}
    </div>
  );
}
