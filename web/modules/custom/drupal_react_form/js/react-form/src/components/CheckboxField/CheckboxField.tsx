import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './CheckboxField.scss';

export function CheckboxField({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;
  const isChecked = Boolean(formValues[name] ?? element.defaultValue ?? false);

  return (
    <div className={`drf-field drf-field--checkbox${hasError ? ' drf-field--error' : ''}`}>
      <label className={`drf-field--checkbox__label${isRequired ? ' drf-field__label--required' : ''}`}>
        <input
          type="checkbox"
          id={`drf-${name}`}
          name={name}
          className="drf-field--checkbox__input"
          checked={isChecked}
          disabled={isDisabled}
          required={isRequired}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          aria-describedby={element.description ? `drf-${name}-desc` : undefined}
          aria-invalid={hasError || undefined}
        />
        <span className="drf-field--checkbox__mark" aria-hidden="true" />
        {element.title && <span className="drf-field--checkbox__text">{element.title}</span>}
      </label>
      {element.description && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
