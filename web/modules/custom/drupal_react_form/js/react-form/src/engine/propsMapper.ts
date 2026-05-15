import type { DrupalElement, EvaluatedStates } from '../types/drupal-form';

function spreadAttrs(attrs: Record<string, string | boolean | number> = {}): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: _c, id: _i, ...rest } = attrs as Record<string, unknown>;
  return rest;
}

export function mapToInputProps(
  el: DrupalElement,
  states: EvaluatedStates,
  name: string,
): React.InputHTMLAttributes<HTMLInputElement> {
  return {
    id: `drf-${name}`,
    name,
    placeholder: el.placeholder,
    disabled: (el.disabled || states.disabled) || undefined,
    required: (el.required || states.required) || undefined,
    maxLength: el.maxlength,
    min: el.min as number | undefined,
    max: el.max as number | undefined,
    step: el.step as number | undefined,
    ...spreadAttrs(el.attributes),
  };
}

export function mapToSelectProps(
  el: DrupalElement,
  states: EvaluatedStates,
  name: string,
): React.SelectHTMLAttributes<HTMLSelectElement> {
  return {
    id: `drf-${name}`,
    name,
    disabled: (el.disabled || states.disabled) || undefined,
    required: (el.required || states.required) || undefined,
    multiple: el.multiple || undefined,
    ...spreadAttrs(el.attributes),
  };
}

export function mapToTextareaProps(
  el: DrupalElement,
  states: EvaluatedStates,
  name: string,
): React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  return {
    id: `drf-${name}`,
    name,
    disabled: (el.disabled || states.disabled) || undefined,
    required: (el.required || states.required) || undefined,
    rows: el.rows ?? 5,
    cols: el.cols,
    placeholder: el.placeholder,
    maxLength: el.maxlength,
    ...spreadAttrs(el.attributes),
  };
}

export function mapToButtonProps(
  el: DrupalElement,
  states: EvaluatedStates,
  name: string,
): React.ButtonHTMLAttributes<HTMLButtonElement> {
  return {
    id: `drf-${name}`,
    name,
    disabled: (el.disabled || states.disabled) || undefined,
    ...spreadAttrs(el.attributes),
  };
}
