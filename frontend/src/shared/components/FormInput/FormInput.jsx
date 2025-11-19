/**
 * FormInput Component - 可複用的表單輸入組件
 * 支援：錯誤顯示、密碼可見性切換、圖示
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from './FormInput.module.scss';

const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  autoComplete,
  required = false,
  icon,
  className,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // 切換密碼可見性
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // 判斷是否為密碼欄位
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className={`${styles.formGroup} ${className || ''}`}>
      {/* Label */}
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}

      {/* Input Container */}
      <div className={styles.inputContainer}>
        {/* Icon (可選) */}
        {icon && (
          <div className={styles.icon}>
            <FontAwesomeIcon icon={icon} />
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`${styles.input} ${error ? styles.error : ''} ${icon ? styles.hasIcon : ''} ${
            isPasswordField ? styles.hasPasswordToggle : ''
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          {...rest}
        />

        {/* Password Visibility Toggle */}
        {isPasswordField && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePasswordVisibility}
            tabIndex={-1}
            aria-label={showPassword ? '隱藏密碼' : '顯示密碼'} // TODO: i18n
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div id={`${name}-error`} className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormInput;
