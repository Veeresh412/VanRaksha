import { MapPin } from 'lucide-react';
import { captureLocation } from '../../services/reportService';
import { useTranslation } from '../../hooks/useTranslation';
import { translateErrorMessage } from '../../utils/i18nHelpers';
import './LocationCard.css';

export default function LocationCard({ location, onLocationChange, loading, setLoading }) {
  const { t } = useTranslation();

  const handleCapture = async () => {
    setLoading(true);
    try {
      const coords = await captureLocation();
      onLocationChange(coords);
    } catch (err) {
      onLocationChange(null, translateErrorMessage(t, err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-card">
      <button
        type="button"
        className="location-card__btn"
        onClick={handleCapture}
        disabled={loading}
      >
        <MapPin size={18} />
        {loading ? t('report.capturing') : t('report.captureLocation')}
      </button>

      {location && location.latitude && (
        <div className="location-card__captured">
          <div className="location-card__status">
            <MapPin size={16} />
            {t('report.locationCapturedLabel')}
          </div>
          <div className="location-card__coords">
            <span className="location-card__coord">
              <strong>{t('report.latitude')}:</strong> {location.latitude.toFixed(6)}
            </span>
            <span className="location-card__coord">
              <strong>{t('report.longitude')}:</strong> {location.longitude.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {location?.error && <p className="location-card__error">{location.error}</p>}
    </div>
  );
}
