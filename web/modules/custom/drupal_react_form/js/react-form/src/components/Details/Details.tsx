import { useCallback, useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import { ChildRenderer } from '../ChildRenderer';
import type { BaseFieldProps, FormValues } from '../../types/drupal-form';
import './Details.scss';

export function Details({ name, element, formValues, onChange }: BaseFieldProps) {
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
    <details className="drf-field drf-field--details" open={states.expanded || undefined}>
      {element.title && (
        <summary className="drf-field--details__summary">{element.title}</summary>
      )}
      <div className="drf-field--details__content">
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
      </div>
    </details>
  );
}
