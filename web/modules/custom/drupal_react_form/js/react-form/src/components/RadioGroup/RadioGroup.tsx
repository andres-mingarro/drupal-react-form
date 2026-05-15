import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './RadioGroup.scss';

export function RadioGroup({ name, element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;
  const currentValue = (formValues[name] as string) ?? (element.defaultValue as string) ?? '';

  return (
    <fieldset className={`drf-field drf-field--radios${hasError ? ' drf-field--error' : ''}`}>
      {element.title && (
        <legend className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </legend>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      <div className="drf-field--radios__options" role="group">
        {(element.options ?? []).map(opt => (
          <label key={opt.value} className="drf-field--radios__option">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={currentValue === opt.value}
              disabled={isDisabled}
              required={isRequired}
              onChange={(e) => onChange(e.target.value)}
              className="drf-field--radios__input"
              aria-invalid={hasError || undefined}
            />
            <span className="drf-field--radios__dot" aria-hidden="true" />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {element.description && element.descriptionDisplay !== 'before' && (
        <p className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </fieldset>
  );
}
