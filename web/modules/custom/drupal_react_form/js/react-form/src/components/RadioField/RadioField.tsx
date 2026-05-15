import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './RadioField.scss';

export function RadioField({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const hasError = Boolean(error);
  const isDisabled = element.disabled || states.disabled;
  const currentValue = (formValues[name] as string) ?? '';

  return (
    <div className={`drf-field drf-field--radio${hasError ? ' drf-field--error' : ''}`}>
      <label className="drf-field--radio__label">
        <input
          type="radio"
          id={`drf-${name}`}
          name={name}
          value={element.value as string ?? name}
          className="drf-field--radio__input"
          checked={currentValue === (element.value as string ?? name)}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError || undefined}
        />
        <span className="drf-field--radio__dot" aria-hidden="true" />
        {element.title && <span className="drf-field--radio__text">{element.title}</span>}
      </label>
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
