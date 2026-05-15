import { useCallback, useEffect, useState } from 'react';
import { evaluateStates } from './engine/statesEngine';
import { ELEMENT_TYPE_MAP } from './engine/elementTypeMap';
import type {
  BaseFieldProps,
  DrupalElement,
  DrupalFormDefinition,
  DrupalFormResponse,
  DrupalSubmitResponse,
  EvaluatedStates,
  FormValues,
} from './types/drupal-form';

interface DrupalFormProps {
  formId: string;
  baseUrl?: string;
  onSubmitSuccess?: (response: DrupalSubmitResponse) => void;
}

interface ElementRendererProps {
  name: string;
  element: DrupalElement;
  formValues: FormValues;
  onChange: (name: string, value: unknown) => void;
  error?: string;
}

function FallbackField({ name, element, formValues, onChange }: BaseFieldProps) {
  console.warn(`[drupal-react-form] Unknown element type: "${element.type}"`);
  return (
    <input
      type="text"
      name={name}
      placeholder={element.title ?? name}
      value={(formValues[name] as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="drf-field__input drf-field__input--fallback"
    />
  );
}

function DrupalElementRenderer({ name, element, formValues, onChange, error }: ElementRendererProps) {
  const states: EvaluatedStates = evaluateStates(element.states, formValues);

  if (element.access === false || !states.visible) return null;

  const mergedElement: DrupalElement = {
    ...element,
    required: element.required || states.required,
    disabled: element.disabled || states.disabled,
  };

  const fieldProps: BaseFieldProps = {
    name,
    element: mergedElement,
    formValues,
    onChange: (v) => onChange(name, v),
    error,
  };

  const Component = ELEMENT_TYPE_MAP[element.type];

  return (
    <>
      {element.prefix && (
        <span className="drf-element__prefix" dangerouslySetInnerHTML={{ __html: element.prefix }} />
      )}
      {Component ? <Component {...fieldProps} /> : <FallbackField {...fieldProps} />}
      {element.suffix && (
        <span className="drf-element__suffix" dangerouslySetInnerHTML={{ __html: element.suffix }} />
      )}
    </>
  );
}

export function DrupalForm({ formId, baseUrl = '', onSubmitSuccess }: DrupalFormProps) {
  const [definition, setDefinition] = useState<DrupalFormDefinition | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${baseUrl}/api/react-form/${encodeURIComponent(formId)}?_format=json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<DrupalFormResponse>;
      })
      .then((data) => {
        setDefinition(data.elements);
        const initial: FormValues = {};
        Object.entries(data.elements).forEach(([k, el]) => {
          if (el.defaultValue !== undefined) initial[k] = el.defaultValue;
        });
        setValues(initial);
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [formId, baseUrl]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    const csrfToken = csrfMeta?.content ?? '';

    try {
      const res = await fetch(`${baseUrl}/api/react-form/${encodeURIComponent(formId)}/submit?_format=json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(values),
      });

      const data = (await res.json()) as DrupalSubmitResponse;

      if (data.success) {
        setSubmitted(true);
        onSubmitSuccess?.(data);
      } else if (data.errors) {
        setErrors(data.errors);
      }
    } catch (err) {
      console.error('[drupal-react-form] Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="drf-form drf-form--loading" aria-busy="true">Cargando formulario...</div>;
  }
  if (fetchError) {
    return <div className="drf-form drf-form--error" role="alert">Error al cargar el formulario: {fetchError}</div>;
  }
  if (submitted) {
    return <div className="drf-form drf-form--success" role="status">Formulario enviado correctamente.</div>;
  }
  if (!definition) return null;

  return (
    <form className={`drf-form${submitting ? ' drf-form--submitting' : ''}`} onSubmit={handleSubmit} noValidate>
      {Object.entries(definition).map(([name, element]) => (
        <DrupalElementRenderer
          key={name}
          name={name}
          element={element}
          formValues={{ ...values, __submitting: submitting }}
          onChange={handleChange}
          error={errors[name]}
        />
      ))}
    </form>
  );
}
