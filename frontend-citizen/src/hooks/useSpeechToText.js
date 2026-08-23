import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Map app locale → Web Speech API language tag.
 * Demo: always English. Swap the return to use `map` when Hindi/Marathi STT is enabled.
 */
export function getSpeechRecognitionLang(appLocale) {
  const map = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
  };

  // Demo requirement: English speech only for now.
  void map;
  void appLocale;
  return 'en-IN';
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}

function appendTranscript(current, transcript) {
  const spoken = String(transcript || '').trim();
  if (!spoken) return current;

  const existing = String(current || '');
  if (!existing.trim()) return spoken;

  const needsSpace = !/\s$/.test(existing);
  return `${existing}${needsSpace ? ' ' : ''}${spoken}`;
}

/**
 * Browser Web Speech API hook for demo speech-to-text.
 * Does not call any external STT service.
 */
export function useSpeechToText({
  value,
  onTranscript,
  locale = 'en',
  maxLength,
}) {
  const [listening, setListening] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef(value);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(() => {
    setErrorKey(null);

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setErrorKey('speech.unsupported');
      return;
    }

    if (recognitionRef.current) {
      stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getSpeechRecognitionLang(locale);
    recognition.maxAlternatives = 1;

    baseTextRef.current = value;

    recognition.onstart = () => {
      setListening(true);
      setErrorKey(null);
    };

    recognition.onerror = (event) => {
      const code = event.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setErrorKey('speech.permissionDenied');
      } else if (code === 'no-speech') {
        setErrorKey('speech.noSpeech');
      } else if (code !== 'aborted') {
        setErrorKey('speech.unavailable');
      }
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interimChunk += transcript;
        }
      }

      if (finalChunk) {
        baseTextRef.current = appendTranscript(baseTextRef.current, finalChunk);
      }

      let next = appendTranscript(baseTextRef.current, interimChunk);
      if (typeof maxLength === 'number') {
        next = next.slice(0, maxLength);
      }
      onTranscriptRef.current?.(next);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setErrorKey('speech.unavailable');
      setListening(false);
      recognitionRef.current = null;
    }
  }, [locale, maxLength, stop, value]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  return {
    listening,
    errorKey,
    supported: isSpeechRecognitionSupported(),
    toggle,
    stop,
    clearError: () => setErrorKey(null),
  };
}
