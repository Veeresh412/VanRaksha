import { X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './InfoSheet.css';

export default function InfoSheet({ slug, onClose }) {
  const { t } = useTranslation();

  if (!slug) return null;

  const title = t(`info.${slug}.title`);
  const body = t(`info.${slug}.body`);

  if (!title || title === `info.${slug}.title`) return null;

  const paragraphs = Array.isArray(body) ? body : [];

  return (
    <div className="info-sheet" role="presentation">
      <button
        type="button"
        className="info-sheet__backdrop"
        onClick={onClose}
        aria-label={t('common.close')}
      />

      <div className="info-sheet__panel" role="dialog" aria-labelledby="info-sheet-title">
        <div className="info-sheet__header">
          <h2 id="info-sheet-title" className="info-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="info-sheet__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={22} />
          </button>
        </div>

        <div className="info-sheet__body">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="info-sheet__paragraph">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
