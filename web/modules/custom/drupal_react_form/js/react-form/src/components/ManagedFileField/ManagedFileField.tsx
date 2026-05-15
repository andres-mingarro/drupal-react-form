import { useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './ManagedFileField.scss';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ManagedFileField({ name, element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const [file, setFile] = useState<File | null>(null);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    onChange(f);
  };

  const handleRemove = () => {
    setFile(null);
    onChange(null);
  };

  return (
    <div className={`drf-field drf-field--managed-file${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      {file ? (
        <div className="drf-field--managed-file__preview">
          <div className="drf-field--managed-file__info">
            <span className="drf-field--managed-file__icon" aria-hidden="true">📄</span>
            <div>
              <p className="drf-field--managed-file__filename">{file.name}</p>
              <p className="drf-field--managed-file__size">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            className="drf-field--managed-file__remove"
            onClick={handleRemove}
            aria-label="Eliminar archivo"
          >
            ✕ Eliminar
          </button>
        </div>
      ) : (
        <input
          type="file"
          id={`drf-${name}`}
          name={name}
          disabled={isDisabled}
          required={isRequired}
          multiple={element.multiple}
          className="drf-field--managed-file__input"
          onChange={handleChange}
          aria-describedby={element.description ? `drf-${name}-desc` : undefined}
          aria-invalid={hasError || undefined}
        />
      )}
      {element.description && element.descriptionDisplay !== 'before' && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
