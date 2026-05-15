import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './CheckboxGroup.scss';

export function CheckboxGroup({ name, element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;
  const selected = ((formValues[name] as string[]) ?? (element.defaultValue as string[]) ?? []);

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(next);
  };

  return (
    <fieldset className={`drf-field drf-field--checkboxes${hasError ? ' drf-field--error' : ''}`} aria-required={isRequired || undefined}>
      {element.title && (
        <legend className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </legend>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      <div className="drf-field--checkboxes__options" role="group">
        {(element.options ?? []).map(opt => (
          <label key={opt.value} className="drf-field--checkboxes__option">
            <input
              type="checkbox"
              name={`${name}[]`}
              value={opt.value}
              checked={selected.includes(opt.value)}
              disabled={isDisabled}
              onChange={() => toggle(opt.value)}
              className="drf-field--checkboxes__input"
              aria-invalid={hasError || undefined}
            />
            <span className="drf-field--checkboxes__mark" aria-hidden="true" />
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
