import { evaluateStates } from '../../engine/statesEngine';
import { mapToButtonProps } from '../../engine/propsMapper';
import type { BaseFieldProps } from '../../types/drupal-form';
import './SubmitButton.scss';

export function SubmitButton({ name, element, formValues }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const buttonProps = mapToButtonProps(element, states, name);
  const submitting = Boolean(formValues.__submitting);
  const label = element.value as string ?? element.title ?? 'Enviar';

  return (
    <div className="drf-field drf-field--submit">
      <button
        {...buttonProps}
        type="submit"
        className={`drf-field--submit__btn${submitting ? ' drf-field--submit__btn--loading' : ''}`}
        disabled={buttonProps.disabled || submitting}
        aria-busy={submitting}
      >
        {submitting ? (
          <>
            <span className="drf-field--submit__spinner" aria-hidden="true" />
            <span>Enviando...</span>
          </>
        ) : label}
      </button>
    </div>
  );
}
