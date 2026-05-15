import type { BaseFieldProps } from '../../types/drupal-form';

export function HiddenField({ name, element, formValues }: BaseFieldProps) {
  const val = (formValues[name] as string) ?? (element.defaultValue as string) ?? (element.value as string) ?? '';
  return <input type="hidden" name={name} value={val} readOnly />;
}
