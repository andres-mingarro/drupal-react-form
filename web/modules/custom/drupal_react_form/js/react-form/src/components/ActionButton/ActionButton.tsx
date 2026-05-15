import { evaluateStates } from '../../engine/statesEngine';
import { mapToButtonProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './ActionButton.scss';

export function ActionButton({ name, element, formValues }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const buttonProps = mapToButtonProps(element, states, name);
  const label = element.value as string ?? element.title ?? name;

  return (
    <div className="drf-field drf-field--button">
      <button {...buttonProps} type="button" className="drf-field--button__btn">
        {label}
      </button>
    </div>
  );
}
