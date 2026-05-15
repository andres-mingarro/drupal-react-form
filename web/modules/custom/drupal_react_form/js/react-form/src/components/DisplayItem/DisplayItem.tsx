import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './DisplayItem.scss';

export function DisplayItem({ element, formValues }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const displayValue = (element.value as string) ?? (element.defaultValue as string) ?? '—';

  return (
    <dl className="drf-field drf-field--item">
      {element.title && <dt className="drf-field__label">{element.title}</dt>}
      <dd className="drf-field--item__value">{displayValue}</dd>
      {element.description && <p className="drf-field__description">{element.description}</p>}
    </dl>
  );
}
