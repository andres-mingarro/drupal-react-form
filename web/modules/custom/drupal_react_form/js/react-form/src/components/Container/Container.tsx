import { useCallback, useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import { ChildRenderer } from '../ChildRenderer';
import type { BaseFieldProps, FormValues } from '../../types/drupal-form';
import './Container.scss';

export function Container({ element, formValues, onChange }: BaseFieldProps) {
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
    <div className="drf-field drf-container">
      {element.children && (
        <ChildRenderer
          children={element.children}
          formValues={{ ...formValues, ...childValues }}
          onChange={handleChildChange}
        />
      )}
    </div>
  );
}
