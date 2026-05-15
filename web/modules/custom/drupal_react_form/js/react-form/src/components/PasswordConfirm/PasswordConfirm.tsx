import { useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import { mapToInputProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './PasswordConfirm.scss';

export function PasswordConfirm({ name, element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const inputProps = mapToInputProps(element, states, name);
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const currentValue = (formValues[name] as string) ?? '';

  const handleConfirmBlur = () => {
    if (confirm && confirm !== currentValue) {
      setMismatch(true);
    } else {
      setMismatch(false);
    }
  };

  const handlePasswordChange = (val: string) => {
    onChange(val);
    if (mismatch && val === confirm) setMismatch(false);
  };

  const handleConfirmChange = (val: string) => {
    setConfirm(val);
    if (mismatch) setMismatch(false);
    if (val === currentValue) onChange(currentValue);
  };

  return (
    <div className={`drf-field drf-field--password-confirm${hasError || mismatch ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      <input
        {...inputProps}
        type="password"
        className={`drf-field__input${hasError ? ' drf-field__input--error' : ''}`}
        value={currentValue}
        onChange={(e) => handlePasswordChange(e.target.value)}
        aria-label={element.title ? `${element.title} — contraseña` : 'Contraseña'}
        aria-required={isRequired || undefined}
      />
      <input
        type="password"
        id={`drf-${name}-confirm`}
        name={`${name}_confirm`}
        placeholder="Confirmar contraseña"
        disabled={inputProps.disabled}
        className={`drf-field__input drf-field--password-confirm__confirm${mismatch ? ' drf-field__input--error' : ''}`}
        value={confirm}
        onChange={(e) => handleConfirmChange(e.target.value)}
        onBlur={handleConfirmBlur}
        aria-label={element.title ? `${element.title} — confirmar contraseña` : 'Confirmar contraseña'}
        aria-invalid={mismatch || undefined}
      />
      {element.description && (
        <p className="drf-field__description">{element.description}</p>
      )}
      {mismatch && <p className="drf-field__error" role="alert">Las contraseñas no coinciden</p>}
      {hasError && !mismatch && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
