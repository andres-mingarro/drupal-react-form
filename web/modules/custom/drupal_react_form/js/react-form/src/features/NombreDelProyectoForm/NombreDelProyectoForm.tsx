import { useCallback, useEffect, useState } from 'react';
import SelectField from '../../components/SelectField';
import TextField from '../../components/TextField';
import UrlField from '../../components/UrlField';
import SubmitButton from '../../components/SubmitButton';
import type { DrupalElement, DrupalFormDefinition, FormValues } from '../../types/drupal-form';
import './NombreDelProyectoForm.scss';

const FORM_ID = 'nombre_del_proyecto';
const SUBMIT_EL: DrupalElement = { key: 'submit', type: 'submit', value: 'Enviar proyecto' };

interface Submission {
  id: number;
  data: Record<string, unknown>;
  uid: number;
  created: number;
}

interface Props { baseUrl?: string; }

export function NombreDelProyectoForm({ baseUrl = '' }: Props) {
  const [definition, setDefinition]   = useState<DrupalFormDefinition | null>(null);
  const [values, setValues]           = useState<FormValues>({});
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Carga la definición del form
  useEffect(() => {
    fetch(`${baseUrl}/api/react-form/dynamic/${FORM_ID}?_format=json`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        setDefinition(data.elements);
        const initial: FormValues = {};
        Object.entries(data.elements as DrupalFormDefinition).forEach(([k, el]) => {
          if (el.defaultValue !== undefined) initial[k] = el.defaultValue;
        });
        setValues(initial);
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  // Carga submissions y pre-popula el form con el último guardado
  const fetchSubmissions = useCallback(() => {
    fetch(`${baseUrl}/api/react-form/dynamic/${FORM_ID}/submissions?_format=json`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.submissions?.length) {
          setSubmissions(data.submissions);
          setValues(data.submissions[0].data as FormValues);
        }
      })
      .catch(() => {});
  }, [baseUrl]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const csrfToken = await fetch(`${baseUrl}/session/token`).then((r) => r.text()).catch(() => '');
    try {
      const res = await fetch(`${baseUrl}/api/react-form/dynamic/${FORM_ID}/submit?_format=json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        fetchSubmissions(); // refresca el panel con los nuevos datos
      } else if (data.errors) {
        setErrors(data.errors);
      }
    } catch (err) {
      console.error('[drupal-react-form] Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)     return <div className="ndpf ndpf--loading" aria-busy="true">Cargando...</div>;
  if (fetchError)  return <div className="ndpf ndpf--error" role="alert">Error: {fetchError}</div>;
  if (!definition) return null;

  const fv    = { ...values, __submitting: submitting };
  const field = (name: string) => definition[name] ?? null;
  const props = (name: string) => ({
    name,
    element: definition[name],
    formValues: fv,
    onChange: (v: unknown) => handleChange(name, v),
    error: errors[name],
  });

  const fieldLabels = Object.fromEntries(
    Object.entries(definition).map(([k, el]) => [k, el.title ?? k])
  );

  const lastSubmission = submissions[0] ?? null;

  return (
    <div className="ndpf__layout">

      {/* ── Formulario ── */}
      <form className={`ndpf${submitting ? ' ndpf--submitting' : ''}`} onSubmit={handleSubmit} noValidate>

        {submitted && (
          <div className="ndpf__success" role="status" aria-live="polite">
            ✓ Proyecto guardado correctamente.
          </div>
        )}

        {field('categoria')         && <SelectField {...props('categoria')} />}
        {field('descripcion')       && <TextField   {...props('descripcion')} />}
        {field('autor')             && <TextField   {...props('autor')} />}
        {field('url_personalizada') && <UrlField    {...props('url_personalizada')} />}

        <div className="ndpf__actions">
          <SubmitButton name="submit" element={SUBMIT_EL} formValues={fv} onChange={() => {}} />
        </div>

      </form>

      {/* ── Último guardado en la base ── */}
      <aside className="ndpf__preview" aria-label="Último guardado">
        <h4 className="ndpf__preview-title">
          Último guardado
          {lastSubmission && (
            <span className="ndpf__preview-date">
              {new Date(lastSubmission.created * 1000).toLocaleString('es-AR')}
            </span>
          )}
        </h4>

        {lastSubmission ? (
          <dl className="ndpf__preview-list">
            {Object.entries(lastSubmission.data).map(([key, val]) => (
              <div key={key} className="ndpf__preview-item">
                <dt className="ndpf__preview-key">{fieldLabels[key] ?? key}</dt>
                <dd className="ndpf__preview-value">
                  {val !== undefined && val !== '' && val !== null
                    ? String(val)
                    : <span className="ndpf__preview-empty">—</span>
                  }
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="ndpf__preview-empty">Aún no hay envíos guardados.</p>
        )}

        {submissions.length > 1 && (
          <p className="ndpf__preview-count">
            {submissions.length} envíos en total
          </p>
        )}
      </aside>

    </div>
  );
}
