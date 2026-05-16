import { useCallback, useEffect, useState } from 'react';
import TextField from '../../components/TextField';
import EmailField from '../../components/EmailField';
import PasswordConfirm from '../../components/PasswordConfirm';
import SelectField from '../../components/SelectField';
import RadioGroup from '../../components/RadioGroup';
import CheckboxGroup from '../../components/CheckboxGroup';
import CheckboxField from '../../components/CheckboxField';
import ManagedFileField from '../../components/ManagedFileField';
import SubmitButton from '../../components/SubmitButton';
import type { DrupalFormDefinition, FormValues } from '../../types/drupal-form';
import './UserEditForm.scss';

interface UserEditFormProps {
  uid: number;
  baseUrl?: string;
  inlineDefinition?: DrupalFormDefinition | null;
}

export function UserEditForm({ uid, baseUrl = '', inlineDefinition }: UserEditFormProps) {
  const [definition, setDefinition] = useState<DrupalFormDefinition | null>(null);
  const [values, setValues]         = useState<FormValues>({});
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (inlineDefinition) {
      setDefinition(inlineDefinition);
      const initial: FormValues = {};
      Object.entries(inlineDefinition).forEach(([k, el]) => {
        if (el.defaultValue !== undefined) initial[k] = el.defaultValue;
      });
      setValues(initial);
      setLoading(false);
      return;
    }

    fetch(`${baseUrl}/api/react-form/user/${uid}?_format=json`)
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
  }, [uid, baseUrl, inlineDefinition]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const csrfToken = await fetch(`${baseUrl}/session/token`).then((r) => r.text()).catch(() => '');
    try {
      const res = await fetch(`${baseUrl}/api/react-form/user/${uid}/submit?_format=json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else if (data.errors) {
        setErrors(data.errors);
      }
    } catch (err) {
      console.error('[drupal-react-form] Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)     return <div className="uef uef--loading" aria-busy="true">Cargando formulario...</div>;
  if (fetchError)  return <div className="uef uef--error" role="alert">Error: {fetchError}</div>;
  if (!definition) return null;

  const fv = { ...values, __submitting: submitting };

  const field = (name: string) => definition[name] ?? null;

  const props = (name: string) => ({
    name,
    element: definition[name],
    formValues: fv,
    onChange: (v: unknown) => handleChange(name, v),
    error: errors[name],
  });

  return (
    <form className={`uef${submitting ? ' uef--submitting' : ''}`} onSubmit={handleSubmit} noValidate>

      {submitted && (
        <div className="uef__success" role="status" aria-live="polite">
          Cambios guardados correctamente.
        </div>
      )}

      {/* ── Cuenta ── */}
      <div className="uef__section">
        <h3 className="uef__section-title">Cuenta</h3>
        {field('name') && <TextField      {...props('name')} />}
        {field('mail') && <EmailField     {...props('mail')} />}
        {field('pass') && <PasswordConfirm {...props('pass')} />}
      </div>

      {/* ── Zona horaria ── */}
      <div className="uef__section">
        <h3 className="uef__section-title">Zona horaria</h3>
        {field('timezone') && <SelectField {...props('timezone')} />}
      </div>

      {/* ── Foto de perfil ── */}
      <div className="uef__section">
        <h3 className="uef__section-title">Foto de perfil</h3>
        {field('user_picture') && <ManagedFileField {...props('user_picture')} />}
      </div>

      {/* ── Administración (solo admins) ── */}
      {(field('status') || field('roles') || field('notify')) && (
        <div className="uef__section">
          <h3 className="uef__section-title">Administración</h3>
          {field('status') && <RadioGroup    {...props('status')} />}
          {field('roles')  && <CheckboxGroup {...props('roles')} />}
          {field('notify') && <CheckboxField {...props('notify')} />}
        </div>
      )}

      {/* ── Acciones ── */}
      <div className="uef__actions">
        {field('submit') && <SubmitButton {...props('submit')} />}
      </div>

    </form>
  );
}
