import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { translateErrorMessage } from '../../utils/i18nHelpers';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { TextArea } from '../../components/common/Input';
import EvidenceUploader from '../../components/reports/EvidenceUploader';
import LocationCard from '../../components/reports/LocationCard';
import { submitReport } from '../../services/reportService';
import './ReportIncident.css';

export default function ReportIncident() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);

  const handleLocationChange = (coords, errMsg) => {
    if (errMsg) {
      setLocation({ error: errMsg });
    } else {
      setLocation(coords);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError(t('report.describeRequired'));
      return;
    }

    if (!location?.latitude) {
      setError(t('report.locationRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const report = await submitReport({
        description: description.trim(),
        photos,
        videos,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setSubmittedReport(report);
    } catch (err) {
      setError(translateErrorMessage(t, err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="report-incident-page">
        <Header title={t('report.submittedTitle')} showBack onBack={() => navigate('/')} />
        <div className="report-incident-page__success">
          <div className="report-incident-page__success-icon">
            <CheckCircle size={32} />
          </div>
          <h2 className="report-incident-page__success-title">{t('report.submittedTitle')}</h2>
          <p className="report-incident-page__success-id">
            {t('report.reportId')}: {submittedReport.id}
          </p>
          <p className="report-incident-page__success-tier-note">{t('report.successMessage')}</p>
          <Button onClick={() => navigate(`/reports/${submittedReport.id}`)}>
            {t('report.viewDetails')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-incident-page">
      <Header title={t('report.title')} showBack />

      <form className="report-incident-page__form" onSubmit={handleSubmit}>
        {error && <div className="report-incident-page__error">{error}</div>}

        <div className="report-incident-page__section">
          <TextArea
            label={t('report.whatObserved')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="report-incident-page__section">
          <p className="report-incident-page__section-label">{t('report.addEvidence')}</p>
          <EvidenceUploader
            photos={photos}
            videos={videos}
            onPhotosChange={setPhotos}
            onVideosChange={setVideos}
          />
        </div>

        <div className="report-incident-page__section">
          <p className="report-incident-page__section-label">{t('report.location')}</p>
          <LocationCard
            location={location}
            onLocationChange={handleLocationChange}
            loading={locationLoading}
            setLoading={setLocationLoading}
          />
        </div>

        <div className="report-incident-page__footer">
          <Button type="submit" disabled={submitting}>
            {submitting ? t('common.submitting') : t('report.submitReport')}
          </Button>
        </div>
      </form>
    </div>
  );
}
