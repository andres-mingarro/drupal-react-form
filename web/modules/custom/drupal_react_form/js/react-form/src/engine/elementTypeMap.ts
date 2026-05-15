import { lazy, type ComponentType } from 'react';
import type { BaseFieldProps } from '../types/drupal-form';

type FieldComponent = ComponentType<BaseFieldProps>;

export const ELEMENT_TYPE_MAP: Record<string, FieldComponent> = {
  textfield:           lazy(() => import('../components/TextField')),
  email:               lazy(() => import('../components/EmailField')),
  password:            lazy(() => import('../components/PasswordField')),
  password_confirm:    lazy(() => import('../components/PasswordConfirm')),
  textarea:            lazy(() => import('../components/TextareaField')),
  number:              lazy(() => import('../components/NumberField')),
  tel:                 lazy(() => import('../components/TelField')),
  url:                 lazy(() => import('../components/UrlField')),
  color:               lazy(() => import('../components/ColorField')),
  range:               lazy(() => import('../components/RangeField')),
  search:              lazy(() => import('../components/SearchField')),
  date:                lazy(() => import('../components/DateField')),
  datetime:            lazy(() => import('../components/DateTimeField')),
  datelist:            lazy(() => import('../components/DateListField')),
  select:              lazy(() => import('../components/SelectField')),
  checkbox:            lazy(() => import('../components/CheckboxField')),
  checkboxes:          lazy(() => import('../components/CheckboxGroup')),
  radio:               lazy(() => import('../components/RadioField')),
  radios:              lazy(() => import('../components/RadioGroup')),
  file:                lazy(() => import('../components/FileField')),
  managed_file:        lazy(() => import('../components/ManagedFileField')),
  submit:              lazy(() => import('../components/SubmitButton')),
  button:              lazy(() => import('../components/ActionButton')),
  fieldset:            lazy(() => import('../components/Fieldset')),
  details:             lazy(() => import('../components/Details')),
  container:           lazy(() => import('../components/Container')),
  item:                lazy(() => import('../components/DisplayItem')),
  hidden:              lazy(() => import('../components/HiddenField')),
  entity_autocomplete: lazy(() => import('../components/EntityAutocomplete')),
};
