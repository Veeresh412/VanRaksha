import { Link, useLocation } from 'react-router-dom';
import { Plus, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { useHomePageData } from '../../hooks/useHomePageData';
import { getGreetingKey } from '../../utils/i18nHelpers';
import Header from '../../components/common/Header';
import ReportCard from '../../components/reports/ReportCard';
import EmptyState from '../../components/common/EmptyState';
import TrustTierStatusCard from '../../components/reports/TrustTierStatusCard';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const { reports, trustStatus, loading } = useHomePageData(user, location.key);

  return (
    <div className="home-page">
      <Header showMenu showNotification showLanguage title={t('brand.name')} />

      <div className="home-page__greeting">
        <p className="home-page__greeting-text">
          {t(getGreetingKey())},<br />
          {user?.name}
        </p>
      </div>

      {!loading && trustStatus && <TrustTierStatusCard status={trustStatus} />}

      <div className="home-page__action">
        <Link to="/report" className="home-page__action-card">
          <div className="home-page__action-icon">
            <Plus size={24} strokeWidth={2.5} />
          </div>
          <div className="home-page__action-text">
            <div className="home-page__action-title">{t('home.reportIncident')}</div>
            <div className="home-page__action-subtitle">{t('home.reportIncidentSubtitle')}</div>
          </div>
          <ChevronRight size={20} opacity={0.7} />
        </Link>
      </div>

      <div className="home-page__recent">
        <div className="home-page__recent-header">
          <h2 className="section-title">{t('home.recentReports')}</h2>
          <Link to="/reports" className="home-page__recent-link">
            {t('common.viewAll')}
          </Link>
        </div>

        {loading ? (
          <div className="home-page__loading">{t('home.loadingReports')}</div>
        ) : reports.length > 0 ? (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        ) : (
          <EmptyState
            icon={FileText}
            title={t('home.noReportsTitle')}
            message={t('home.noReportsMessage')}
          />
        )}
      </div>
    </div>
  );
}
