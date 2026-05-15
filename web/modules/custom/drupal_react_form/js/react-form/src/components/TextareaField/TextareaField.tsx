import { evaluateStates } from '../../engine/statesEngine';
import { mapToTextareaProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './TextareaField.scss';

export function TextareaField({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const textareaProps = mapToTextareaProps(element, states, name);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;

  return (
    <div className={`drf-field drf-field--textarea${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      <textarea
        {...textareaProps}
        className={`drf-field__input drf-field--textarea__input${hasError ? ' drf-field__input--error' : ''}`}
        value={(formValues[name] as string) ?? (element.defaultValue as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-describedby={element.description ? `drf-${name}-desc` : undefined}
        aria-invalid={hasError || undefined}
        aria-required={isRequired || undefined}
      />
      {element.description && element.descriptionDisplay !== 'before' && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
