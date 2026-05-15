import type { DrupalStateCondition, DrupalStates, EvaluatedStates, FormValues } from '../types/drupal-form';

function evaluateCondition(cond: DrupalStateCondition, values: FormValues): boolean {
  const v = values[cond.field];
  switch (cond.condition) {
    case 'value':     return v === cond.value;
    case 'checked':   return v === true || v === 1 || v === 'true';
    case 'unchecked': return v === false || v === 0 || v === 'false' || v == null || v === '';
    case 'empty':     return v == null || v === '';
    case 'filled':    return v != null && v !== '';
    case 'pattern':   return typeof v === 'string' && typeof cond.value === 'string' && new RegExp(cond.value).test(v);
    default:          return false;
  }
}

function all(conditions: DrupalStateCondition[], values: FormValues): boolean {
  return conditions.every(c => evaluateCondition(c, values));
}

export function evaluateStates(states: DrupalStates | undefined, values: FormValues): EvaluatedStates {
  if (!states) {
    return { visible: true, required: false, disabled: false, expanded: false, checked: false };
  }

  const visible = states.invisible
    ? !all(states.invisible, values)
    : states.visible
    ? all(states.visible, values)
    : true;

  const required = states.required
    ? all(states.required, values)
    : states.optional
    ? !all(states.optional, values)
    : false;

  const disabled = states.disabled
    ? all(states.disabled, values)
    : states.enabled
    ? !all(states.enabled, values)
    : false;

  return {
    visible,
    required,
    disabled,
    expanded: states.expanded ? all(states.expanded, values) : false,
    checked:  states.checked  ? all(states.checked,  values) : false,
  };
}
