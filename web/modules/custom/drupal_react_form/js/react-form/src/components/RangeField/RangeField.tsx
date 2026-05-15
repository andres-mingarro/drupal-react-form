import { evaluateStates } from '../../engine/statesEngine';
import { mapToInputProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './RangeField.scss';

export function RangeField({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const inputProps = mapToInputProps(element, states, name);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const currentValue = (formValues[name] as string) ?? (element.defaultValue as string) ?? String(element.min ?? 0);

  return (
    <div className={`drf-field drf-field--range${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      <div className="drf-field--range__wrapper">
        <input
          {...inputProps}
          type="range"
          className="drf-field--range__slider"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={element.description ? `drf-${name}-desc` : undefined}
          aria-valuetext={currentValue}
        />
        <output className="drf-field--range__output" htmlFor={`drf-${name}`}>
          {currentValue}
        </output>
      </div>
      {element.description && element.descriptionDisplay !== 'before' && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
