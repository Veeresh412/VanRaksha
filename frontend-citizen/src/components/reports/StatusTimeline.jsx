import { Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { TIMELINE_STEPS, getTimelineIndex } from '../../utils/statusUtils';
import './StatusTimeline.css';

export default function StatusTimeline({ report }) {
  const { t } = useTranslation();
  const currentIndex = getTimelineIndex(report.status);

  const steps = TIMELINE_STEPS.map((step, index) => ({
    step,
    label: t(`status.${step === 'under_review' ? 'underReview' : step}`),
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));

  return (
    <div className="status-timeline">
      {steps.map((step) => (
        <div
          key={step.step}
          className={[
            'status-timeline__step',
            step.completed ? 'status-timeline__step--completed' : 'status-timeline__step--pending',
            step.current ? 'status-timeline__step--current' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="status-timeline__dot">
            {step.completed && !step.current && (
              <Check size={14} color="#fff" strokeWidth={3} />
            )}
            {step.current && <span className="status-timeline__dot-inner" />}
          </div>
          <div className="status-timeline__content">
            <span className="status-timeline__label">{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
