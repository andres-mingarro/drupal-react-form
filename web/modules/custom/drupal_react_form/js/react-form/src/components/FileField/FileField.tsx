import { useRef } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import { mapToInputProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './FileField.scss';

export function FileField({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const inputProps = mapToInputProps(element, states, name);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const fileRef = useRef<HTMLInputElement>(null);
  const file = formValues[name] as File | null;

  return (
    <div className={`drf-field drf-field--file${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      <div className="drf-field--file__wrapper">
        <input
          {...inputProps}
          ref={fileRef}
          type="file"
          multiple={element.multiple}
          className="drf-field--file__input"
          onChange={(e) => onChange(element.multiple ? e.target.files : e.target.files?.[0] ?? null)}
          onBlur={onBlur}
          aria-describedby={element.description ? `drf-${name}-desc` : undefined}
          aria-invalid={hasError || undefined}
          aria-required={isRequired || undefined}
        />
        {file && <span className="drf-field--file__name">{file.name}</span>}
      </div>
      {element.description && element.descriptionDisplay !== 'before' && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
