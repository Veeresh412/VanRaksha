import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export function Input({
  label,
  type = 'text',
  icon: Icon,
  error,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-group__label">{label}</label>}
      <div className="input-group__wrapper">
        {Icon && (
          <span className="input-group__icon">
            <Icon size={18} />
          </span>
        )}
        <input
          className={[
            'input-group__field',
            !Icon ? 'input-group__field--no-icon' : '',
            error ? 'input-group__field--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          type={inputType}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-group__toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}

export function TextArea({ label, maxLength = 500, value = '', onChange, error, className = '', ...props }) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-group__label">{label}</label>}
      <textarea
        className={`input-group__textarea ${error ? 'input-group__field--error' : ''}`}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        rows={5}
        {...props}
      />
      {maxLength && (
        <div className="input-group__counter">
          {value.length}/{maxLength}
        </div>
      )}
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}

export function Select({
  label,
  icon: Icon,
  error,
  options = [],
  placeholder = 'Select an option',
  className = '',
  ...props
}) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-group__label">{label}</label>}
      <div className="input-group__wrapper">
        {Icon && (
          <span className="input-group__icon">
            <Icon size={18} />
          </span>
        )}
        <select
          className={[
            'input-group__field',
            'input-group__field--select',
            !Icon ? 'input-group__field--no-icon' : '',
            error ? 'input-group__field--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}
