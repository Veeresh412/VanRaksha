import { Mic, MicOff } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { TextArea } from '../common/Input';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import './ObservationSpeechField.css';

/**
 * Observation textarea with an attached microphone for Web Speech API dictation.
 * Reuses the parent-controlled value/onChange — does not keep a separate text state.
 */
export default function ObservationSpeechField({
  label,
  value,
  onChange,
  maxLength = 500,
  error,
}) {
  const { t, locale } = useTranslation();

  const handleTranscript = (nextText) => {
    onChange({ target: { value: nextText } });
  };

  const { listening, errorKey, toggle } = useSpeechToText({
    value,
    onTranscript: handleTranscript,
    locale,
    maxLength,
  });

  return (
    <div className="observation-speech">
      <div className="observation-speech__field">
        <TextArea
          label={label}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          error={error}
          className="observation-speech__textarea-group"
        />

        <button
          type="button"
          className={[
            'observation-speech__mic',
            listening ? 'observation-speech__mic--listening' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={toggle}
          aria-pressed={listening}
          aria-label={listening ? t('speech.stopSpeaking') : t('speech.startSpeaking')}
          title={listening ? t('speech.stopSpeaking') : t('speech.tapToSpeak')}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>

      <p className="observation-speech__hint">
        {listening ? t('speech.listening') : t('speech.tapToSpeak')}
      </p>

      {errorKey && (
        <p className="observation-speech__error" role="status">
          {t(errorKey)}
        </p>
      )}
    </div>
  );
}
