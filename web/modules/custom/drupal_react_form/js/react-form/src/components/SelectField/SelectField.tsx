import { evaluateStates } from '../../engine/statesEngine';
import { mapToSelectProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './SelectField.scss';

export function SelectField({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const selectProps = mapToSelectProps(element, states, name);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const value = (formValues[name] as string | string[]) ?? (element.defaultValue as string) ?? '';

  const groups = new Set(element.options?.map(o => o.group).filter(Boolean));
  const hasGroups = groups.size > 0;

  const renderOptions = (groupName?: string) =>
    (element.options ?? [])
      .filter(o => (groupName ? o.group === groupName : !o.group))
      .map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ));

  return (
    <div className={`drf-field drf-field--select${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}
      <div className="drf-field--select__wrapper">
        <select
          {...selectProps}
          className={`drf-field__input drf-field--select__input${hasError ? ' drf-field__input--error' : ''}`}
          value={value}
          onChange={(e) => {
            if (element.multiple) {
              const selected = Array.from(e.target.selectedOptions, o => o.value);
              onChange(selected);
            } else {
              onChange(e.target.value);
            }
          }}
          onBlur={onBlur}
          aria-describedby={element.description ? `drf-${name}-desc` : undefined}
          aria-invalid={hasError || undefined}
          aria-required={isRequired || undefined}
        >
          {!element.multiple && !element.required && <option value="">— Seleccioná —</option>}
          {hasGroups
            ? Array.from(groups).map(g => (
                <optgroup key={g} label={g}>{renderOptions(g)}</optgroup>
              ))
            : renderOptions()
          }
        </select>
        {!element.multiple && <span className="drf-field--select__arrow" aria-hidden="true">▼</span>}
      </div>
      {element.description && element.descriptionDisplay !== 'before' && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
