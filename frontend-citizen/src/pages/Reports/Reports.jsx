import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { translateErrorMessage } from '../../utils/i18nHelpers';
import { getReports } from '../../services/reportService';
import { getStatusCounts } from '../../utils/statusUtils';
import ReportCard from '../../components/reports/ReportCard';
import EmptyState from '../../components/common/EmptyState';
import HeaderLanguagePicker from '../../components/layout/HeaderLanguagePicker';
import './Reports.css';

const FILTER_VALUES = ['all', 'processing', 'under_review', 'submitted', 'resolved'];

const FILTER_LABEL_KEYS = {
  all: 'reports.filters.all',
  processing: 'reports.filters.processing',
  under_review: 'reports.filters.underReview',
  submitted: 'reports.filters.submitted',
  resolved: 'reports.filters.resolved',
};

export default function Reports() {
  const { t } = useTranslation();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const handleFilterChange = (value) => {
    setLoading(true);
    setError('');
    setFilter(value);
  };

  useEffect(() => {
    getReports()
      .then(setAllReports)
      .catch(() => {
        // Summary counts are optional when the list fetch fails.
      });
  }, [location.key]);

  useEffect(() => {
    let cancelled = false;

    getReports({ status: filter })
      .then((data) => {
        if (!cancelled) {
          setReports(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReports([]);
          setError(translateErrorMessage(t, err.message));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filter or navigation changes
  }, [filter, location.key]);

  const counts = getStatusCounts(allReports);

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {t('reports.title')}
        </h1>
        <button
          className="reports-page__filter-btn"
          onClick={() => setShowFilter(!showFilter)}
          aria-label={t('reports.filter')}
        >
          <Filter size={20} />
        </button>
      </div>

      <div className="reports-page__language">
        <HeaderLanguagePicker />
      </div>

      <div className="reports-page__summary">
        <div className="reports-page__summary-card">
          <div className="reports-page__summary-count">{counts.total || reports.length}</div>
          <div className="reports-page__summary-label">{t('reports.totalReports')}</div>
        </div>
        <div className="reports-page__summary-card">
          <div className="reports-page__summary-count">{counts.processing}</div>
          <div className="reports-page__summary-label">{t('reports.processing')}</div>
        </div>
        <div className="reports-page__summary-card">
          <div className="reports-page__summary-count">{counts.under_review}</div>
          <div className="reports-page__summary-label">{t('reports.underReview')}</div>
        </div>
      </div>

      {showFilter && (
        <div className="reports-page__filter-panel">
          <div className="reports-page__filter-options">
            {FILTER_VALUES.map((value) => (
              <button
                key={value}
                className={`reports-page__filter-option ${filter === value ? 'reports-page__filter-option--active' : ''}`}
                onClick={() => handleFilterChange(value)}
              >
                {t(FILTER_LABEL_KEYS[value])}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="reports-page__list">
        {loading ? (
          <div className="reports-page__loading">
            <div className="loading-spinner" aria-hidden="true" />
            <p>{t('reports.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title={t('reports.errorTitle')}
            message={error}
          />
        ) : reports.length > 0 ? (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        ) : (
          <EmptyState
            icon={FileText}
            title={t('reports.noReportsTitle')}
            message={filter === 'all' ? t('reports.noReportsAll') : t('reports.noReportsFilter')}
          />
        )}
      </div>
    </div>
  );
}
