import { useRef, useEffect } from 'react';
import { OTP_LENGTH } from '../../services/otpService';
import './OtpInput.css';

export default function OtpInput({
  value,
  onChange,
  length = OTP_LENGTH,
  disabled = false,
  error = false,
  ariaLabelPrefix = 'Digit',
}) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length);
  }, [length]);

  const focusIndex = (index) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const emit = (nextDigits) => {
    onChange(nextDigits.join('').slice(0, length));
  };

  const handleChange = (index, raw) => {
    const cleaned = raw.replace(/\D/g, '');

    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      emit(next);
      return;
    }

    // Paste or multi-digit entry: distribute across boxes.
    if (cleaned.length > 1) {
      const next = [...digits];
      const chars = cleaned.slice(0, length - index).split('');
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      emit(next);
      focusIndex(Math.min(index + chars.length, length - 1));
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    emit(next);
    if (index < length - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = [...digits];
      if (digits[index]) {
        next[index] = '';
        emit(next);
      } else if (index > 0) {
        next[index - 1] = '';
        emit(next);
        focusIndex(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (index, event) => {
    event.preventDefault();
    const pasted = (event.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (!pasted) return;

    const next = [...digits];
    const chars = pasted.slice(0, length - index).split('');
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    emit(next);
    focusIndex(Math.min(index + chars.length, length - 1));
  };

  return (
    <div
      className={`otp-input ${error ? 'otp-input--error' : ''}`}
      role="group"
      aria-label={ariaLabelPrefix}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className="otp-input__box"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabelPrefix} ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
