import { type ComponentType } from 'react';
import type { BaseFieldProps } from '../types/drupal-form';

import TextField from '../components/TextField';
import EmailField from '../components/EmailField';
import PasswordField from '../components/PasswordField';
import PasswordConfirm from '../components/PasswordConfirm';
import TextareaField from '../components/TextareaField';
import NumberField from '../components/NumberField';
import TelField from '../components/TelField';
import UrlField from '../components/UrlField';
import ColorField from '../components/ColorField';
import RangeField from '../components/RangeField';
import SearchField from '../components/SearchField';
import DateField from '../components/DateField';
import DateTimeField from '../components/DateTimeField';
import DateListField from '../components/DateListField';
import SelectField from '../components/SelectField';
import CheckboxField from '../components/CheckboxField';
import CheckboxGroup from '../components/CheckboxGroup';
import RadioField from '../components/RadioField';
import RadioGroup from '../components/RadioGroup';
import FileField from '../components/FileField';
import ManagedFileField from '../components/ManagedFileField';
import SubmitButton from '../components/SubmitButton';
import ActionButton from '../components/ActionButton';
import Fieldset from '../components/Fieldset';
import Details from '../components/Details';
import Container from '../components/Container';
import DisplayItem from '../components/DisplayItem';
import HiddenField from '../components/HiddenField';
import EntityAutocomplete from '../components/EntityAutocomplete';

type FieldComponent = ComponentType<BaseFieldProps>;

export const ELEMENT_TYPE_MAP: Record<string, FieldComponent> = {
  textfield:           TextField,
  email:               EmailField,
  password:            PasswordField,
  password_confirm:    PasswordConfirm,
  textarea:            TextareaField,
  number:              NumberField,
  tel:                 TelField,
  url:                 UrlField,
  color:               ColorField,
  range:               RangeField,
  search:              SearchField,
  date:                DateField,
  datetime:            DateTimeField,
  datelist:            DateListField,
  select:              SelectField,
  checkbox:            CheckboxField,
  checkboxes:          CheckboxGroup,
  radio:               RadioField,
  radios:              RadioGroup,
  file:                FileField,
  managed_file:        ManagedFileField,
  submit:              SubmitButton,
  button:              ActionButton,
  fieldset:            Fieldset,
  details:             Details,
  container:           Container,
  item:                DisplayItem,
  hidden:              HiddenField,
  entity_autocomplete: EntityAutocomplete,
};
