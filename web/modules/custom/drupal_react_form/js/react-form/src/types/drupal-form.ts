export type DrupalElementType =
  | 'textfield' | 'email' | 'password' | 'password_confirm'
  | 'textarea' | 'number' | 'tel' | 'url' | 'color' | 'range'
  | 'search' | 'hidden' | 'date' | 'datetime' | 'datelist'
  | 'select' | 'checkbox' | 'checkboxes' | 'radio' | 'radios'
  | 'file' | 'managed_file' | 'submit' | 'button'
  | 'fieldset' | 'details' | 'container' | 'item'
  | 'entity_autocomplete' | 'machine_name' | 'language_select';

export interface DrupalOption {
  value: string;
  label: string;
  group?: string;
}

export interface DrupalStateCondition {
  field: string;
  condition: 'value' | 'checked' | 'unchecked' | 'empty' | 'filled' | 'pattern';
  value?: string | boolean | number;
}

export interface DrupalStates {
  visible?: DrupalStateCondition[];
  invisible?: DrupalStateCondition[];
  required?: DrupalStateCondition[];
  optional?: DrupalStateCondition[];
  disabled?: DrupalStateCondition[];
  enabled?: DrupalStateCondition[];
  checked?: DrupalStateCondition[];
  unchecked?: DrupalStateCondition[];
  expanded?: DrupalStateCondition[];
  collapsed?: DrupalStateCondition[];
}

export interface DrupalElement {
  key: string;
  type: DrupalElementType;
  title?: string;
  description?: string;
  descriptionDisplay?: 'before' | 'after' | 'invisible';
  required?: boolean;
  defaultValue?: string | string[] | boolean | number;
  value?: string | boolean | number;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  options?: DrupalOption[];
  attributes?: Record<string, string | boolean | number>;
  states?: DrupalStates;
  access?: boolean;
  weight?: number;
  maxlength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
  cols?: number;
  prefix?: string;
  suffix?: string;
  titleDisplay?: 'before' | 'after' | 'invisible' | 'attribute';
  children?: DrupalFormDefinition;
}

export type DrupalFormDefinition = Record<string, DrupalElement>;

export interface DrupalFormResponse {
  success: boolean;
  form_id: string;
  elements: DrupalFormDefinition;
}

export interface DrupalSubmitResponse {
  success: boolean;
  errors?: Record<string, string>;
  redirect?: string;
  messages?: string[];
}

export type FormValues = Record<string, unknown>;

export interface EvaluatedStates {
  visible: boolean;
  required: boolean;
  disabled: boolean;
  expanded: boolean;
  checked: boolean;
}

export interface BaseFieldProps {
  name: string;
  element: DrupalElement;
  formValues: FormValues;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
}
