import { useCallback, useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import { ChildRenderer } from '../ChildRenderer';
import type { BaseFieldProps, FormValues } from '../../types/drupal-form';
import './Fieldset.scss';

export function Fieldset({ element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const [childValues, setChildValues] = useState<FormValues>({});

  const handleChildChange = useCallback((childName: string, value: unknown) => {
    setChildValues(prev => {
      const next = { ...prev, [childName]: value };
      onChange(next);
      return next;
    });
  }, [onChange]);

  return (
    <fieldset className={`drf-field drf-field--fieldset${error ? ' drf-field--error' : ''}`}>
      {element.title && <legend className="drf-field--fieldset__legend">{element.title}</legend>}
      {element.description && (
        <p className="drf-field__description">{element.description}</p>
      )}
      {element.children && (
        <ChildRenderer
          children={element.children}
          formValues={{ ...formValues, ...childValues }}
          onChange={handleChildChange}
        />
      )}
    </fieldset>
  );
}
