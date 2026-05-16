# Drupal React Form — Documentación del componente

Sistema que expone formularios como JSON y los renderiza con React, permitiendo control total sobre el markup desde el theme.

---

## Índice

1. [Flujo de datos](#flujo-de-datos)
2. [Montar el componente en cualquier template](#montar-el-componente-en-cualquier-template)
3. [SDC: llevar el form a un componente del theme](#sdc-llevar-el-form-a-un-componente-del-theme)
4. [Crear un componente React con markup custom](#crear-un-componente-react-con-markup-custom)
5. [Registrar el componente en el registry](#registrar-el-componente-en-el-registry)
6. [Todos los field components](#todos-los-field-components)
7. [Layout: filas y columnas](#layout-filas-y-columnas)
8. [Theming: CSS por componente](#theming-css-por-componente)
9. [Definición inline — evitar el fetch](#definición-inline--evitar-el-fetch)
10. [API de referencia](#api-de-referencia)
11. [Build](#build)

---

## Flujo de datos

```
Base de datos / Clase PHP
        │
        │  serializa a JSON
        ▼
GET /api/react-form/dynamic/[nombre-form]
        │
        │  { elements: { [campo]: { type, title, options... } } }
        ▼
index.tsx detecta [data-react-form]
        │
        ├── user:UID         →  UserEditForm
        ├── dynamic:[id]     →  componente del registry, o DrupalForm genérico
        └── Drupal.M.F.Bar   →  DrupalForm genérico
        │
        ▼
Componente React recibe `definition` (el contrato)
  → renderiza cada campo con su field component
  → gestiona estado local (values, errors, submitting)
  → POST JSON al submit
        │
        ▼
POST /api/react-form/dynamic/[nombre-form]/submit
  → guarda en drupal_react_form_submissions
```

### El contrato JSON

```json
{
  "success": true,
  "elements": {
    "[campo_1]": {
      "key":      "[campo_1]",
      "type":     "select",
      "title":    "Categoría",
      "required": false,
      "options":  [
        { "value": "opcion_a", "label": "Opción A" },
        { "value": "opcion_b", "label": "Opción B" }
      ],
      "weight": 0
    },
    "[campo_2]": {
      "key":   "[campo_2]",
      "type":  "textfield",
      "title": "Autor",
      "weight": 1
    }
  }
}
```

Cada field component recibe solo su slice del contrato. **No sabe de dónde viene — solo consume la definición.**

```tsx
<SelectField
  name="[campo_1]"
  element={definition['[campo_1]']}  // { type, title, options, required... }
  formValues={values}
  onChange={(v) => handleChange('[campo_1]', v)}
  error={errors['[campo_1]']}
/>
```

---

## Montar el componente en cualquier template

### Opción A — Twig directo

```twig
<div
  data-react-form
  data-form-id="dynamic:[nombre-form]"
></div>
{{ attach_library('drupal_react_form/react-form-app') }}
```

### Opción B — Desde un controller PHP

```php
return [
  '#type'     => 'inline_template',
  '#template' => '<div data-react-form data-form-id="dynamic:[nombre-form]"></div>',
  '#attached' => ['library' => ['drupal_react_form/react-form-app']],
];
```

El bundle escanea todos los `[data-react-form]` de la página y monta el componente correspondiente en cada uno.

---

## SDC: llevar el form a un componente del theme

Cada formulario puede vivir como un componente SDC en `components/features/` del theme. Esto permite incluirlo en cualquier template con una línea y pasarle datos de Drupal como props.

### Estructura mínima

```
web/themes/custom/[theme]/components/features/[nombre-form]/
  [nombre-form].component.yml
  [nombre-form].twig
  [nombre-form].css
```

### `[nombre-form].component.yml`

```yaml
$schema: https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json

name: [Nombre Form]
description: Descripción del formulario.

libraryOverrides:
  dependencies:
    - drupal_react_form/react-form-app

props:
  type: object
  additionalProperties: false
  properties:
    title:
      type: string
      title: Encabezado opcional
```

### `[nombre-form].twig`

```twig
{{ attach_library('drupal_react_form/react-form-app') }}

{% set wrapper_attributes = (attributes is defined ? attributes : create_attribute()).addClass([
  '[nombre-form]',
]) %}

<section{{ wrapper_attributes }}>
  {% if title is defined and title %}
    <h2 class="[nombre-form]__title">{{ title }}</h2>
  {% endif %}

  <div
    data-react-form
    data-form-id="dynamic:[nombre-form]"
  ></div>
</section>
```

### `[nombre-form].css`

```css
.[nombre-form] {
  max-width: 720px;
}

.[nombre-form]__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--lg);
}
```

### Incluirlo en cualquier template del theme

```twig
{# page.html.twig, node.html.twig, etc. #}
{% include 'react_form_test:[nombre-form]' with {
  title: 'Mi formulario',
} %}
```

### Incluirlo con datos de Drupal como props

Si necesitás pasar datos del usuario u otra entidad, usá un preprocess hook en el `.theme`:

```php
// [theme].theme
function [theme]_preprocess_page(&$variables): void {
  $uid = (int) \Drupal::currentUser()->id();
  if ($uid) {
    $user = \Drupal\user\Entity\User::load($uid);
    $variables['user_data'] = [
      'uid'  => $uid,
      'name' => $user->getAccountName(),
      'mail' => $user->getEmail(),
    ];
  }
}
```

```twig
{# En el template, pasás esos datos al componente #}
{% if user_data is defined %}
  {% include 'react_form_test:[nombre-form]' with {
    uid:   user_data.uid,
    name:  user_data.name,
    title: 'Editar perfil',
  } %}
{% endif %}
```

---

## Crear un componente React con markup custom

Cuando necesitás control total sobre el layout (columnas, secciones, agrupaciones), creás un componente dedicado.

### Estructura de archivos

```
js/react-form/src/features/[NombreForm]/
  [NombreForm].tsx    ← markup y lógica
  [NombreForm].scss   ← diseño exclusivo
  index.ts
```

### `[NombreForm].tsx` — estructura base

```tsx
import { useCallback, useEffect, useState } from 'react';
import TextField   from '../../components/TextField';
import EmailField  from '../../components/EmailField';
import SelectField from '../../components/SelectField';
import SubmitButton from '../../components/SubmitButton';
import type { DrupalElement, DrupalFormDefinition, FormValues } from '../../types/drupal-form';
import './[NombreForm].scss';

const FORM_ID = '[nombre-form]';
const SUBMIT_EL: DrupalElement = { key: 'submit', type: 'submit', value: 'Enviar' };

interface Props { baseUrl?: string; }

export function [NombreForm]({ baseUrl = '' }: Props) {
  const [definition, setDefinition] = useState<DrupalFormDefinition | null>(null);
  const [values, setValues]         = useState<FormValues>({});
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    fetch(`${baseUrl}/api/react-form/dynamic/${FORM_ID}?_format=json`)
      .then(r => r.json())
      .then(data => {
        setDefinition(data.elements);
        const init: FormValues = {};
        Object.entries(data.elements as DrupalFormDefinition).forEach(([k, el]) => {
          if (el.defaultValue !== undefined) init[k] = el.defaultValue;
        });
        setValues(init);
      })
      .finally(() => setLoading(false));
  }, [baseUrl]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const csrf = await fetch(`${baseUrl}/session/token`).then(r => r.text()).catch(() => '');
    try {
      const res  = await fetch(`${baseUrl}/api/react-form/dynamic/${FORM_ID}/submit?_format=json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      if (data.errors)  setErrors(data.errors);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !definition) return <div className="nf nf--loading">Cargando...</div>;

  const fv    = { ...values, __submitting: submitting };
  const field = (name: string) => definition[name] ?? null;
  const props = (name: string) => ({
    name,
    element:    definition[name],
    formValues: fv,
    onChange:   (v: unknown) => handleChange(name, v),
    error:      errors[name],
  });

  return (
    <form className={`nf${submitting ? ' nf--submitting' : ''}`} onSubmit={handleSubmit} noValidate>

      {submitted && <div className="nf__success">Enviado correctamente.</div>}

      {/* ── Acá controlás el markup completamente ── */}

      <div className="nf__row">
        {field('[campo_1]') && <TextField  {...props('[campo_1]')} />}
        {field('[campo_2]') && <EmailField {...props('[campo_2]')} />}
      </div>

      {field('[campo_3]') && <SelectField {...props('[campo_3]')} />}

      <div className="nf__actions">
        <SubmitButton name="submit" element={SUBMIT_EL} formValues={fv} onChange={() => {}} />
      </div>

    </form>
  );
}
```

### `index.ts`

```ts
export { [NombreForm] } from './[NombreForm]';
```

---

## Registrar el componente en el registry

Abrís `js/react-form/src/index.tsx` y agregás el import y la entrada en `DYNAMIC_REGISTRY`:

```tsx
import { [NombreForm] } from './features/[NombreForm]';

const DYNAMIC_REGISTRY: Record<string, ComponentType<{ baseUrl?: string }>> = {
  [nombre_form]: [NombreForm],   // ← agregar acá
};
```

A partir de este momento, `data-form-id="dynamic:[nombre-form]"` monta `[NombreForm]` en lugar del genérico.

> Si el ID **no está** en el registry, el sistema usa `DrupalForm` genérico automáticamente — no hace falta registrar todos los forms, solo los que necesitan markup custom.

---

## Todos los field components

Todos aceptan `BaseFieldProps`:

```tsx
interface BaseFieldProps {
  name:       string;
  element:    DrupalElement;   // definición del campo
  formValues: FormValues;      // estado completo del form
  onChange:   (value: unknown) => void;
  onBlur?:    () => void;
  error?:     string;
}
```

| Componente | Tipo | Import |
|-----------|------|--------|
| `TextField` | `textfield` | `../../components/TextField` |
| `EmailField` | `email` | `../../components/EmailField` |
| `PasswordField` | `password` | `../../components/PasswordField` |
| `PasswordConfirm` | `password_confirm` | `../../components/PasswordConfirm` |
| `TextareaField` | `textarea` | `../../components/TextareaField` |
| `NumberField` | `number` | `../../components/NumberField` |
| `TelField` | `tel` | `../../components/TelField` |
| `UrlField` | `url` | `../../components/UrlField` |
| `SelectField` | `select` | `../../components/SelectField` |
| `CheckboxField` | `checkbox` | `../../components/CheckboxField` |
| `CheckboxGroup` | `checkboxes` | `../../components/CheckboxGroup` |
| `RadioField` | `radio` | `../../components/RadioField` |
| `RadioGroup` | `radios` | `../../components/RadioGroup` |
| `DateField` | `date` | `../../components/DateField` |
| `DateTimeField` | `datetime` | `../../components/DateTimeField` |
| `ManagedFileField` | `managed_file` | `../../components/ManagedFileField` |
| `FileField` | `file` | `../../components/FileField` |
| `SubmitButton` | `submit` | `../../components/SubmitButton` |
| `HiddenField` | `hidden` | `../../components/HiddenField` |

### Helpers para usarlos

```tsx
// Verifica si el campo existe en la definición
const field = (name: string) => definition[name] ?? null;

// Arma las props estándar de cada campo
const props = (name: string) => ({
  name,
  element:    definition[name],
  formValues: { ...values, __submitting: submitting },
  onChange:   (v: unknown) => handleChange(name, v),
  error:      errors[name],
});

// Renderizado condicional
{field('[campo]') && <TextField {...props('[campo]')} />}

// Submit sin definición en la API
const SUBMIT_EL: DrupalElement = { key: 'submit', type: 'submit', value: 'Enviar' };
<SubmitButton name="submit" element={SUBMIT_EL} formValues={fv} onChange={() => {}} />
```

---

## Layout: filas y columnas

El layout lo definís en el TSX con clases propias. Ejemplos:

```tsx
{/* Dos columnas principales */}
<div className="nf__grid">
  <div className="nf__col">
    {field('nombre') && <TextField  {...props('nombre')} />}
    {field('email')  && <EmailField {...props('email')} />}
  </div>
  <div className="nf__col">
    {field('foto')    && <ManagedFileField {...props('foto')} />}
    {field('zona')    && <SelectField      {...props('zona')} />}
  </div>
</div>

{/* Dos campos en la misma fila dentro de una columna */}
<div className="nf__row">
  {field('nombre') && <TextField  {...props('nombre')} />}
  {field('apellido') && <TextField {...props('apellido')} />}
</div>

{/* Campo a ancho completo */}
{field('descripcion') && <TextareaField {...props('descripcion')} />}
```

```scss
// [NombreForm].scss
.nf {
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;

    @media (max-width: 640px) { grid-template-columns: 1fr; }
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 480px) { grid-template-columns: 1fr; }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
}
```

---

## Theming: CSS por componente

Cada componente tiene su propio SCSS. Lo más importante: **override de variables `--drf-*`** en el scope del form, para que los field components (TextField, SelectField, etc.) se vean diferente en cada form sin tocar su código.

```scss
// [NombreForm].scss
.nf {
  // Override de variables — solo afecta los campos dentro de .nf
  --drf-primary:      #7c3aed;
  --drf-border:       #e9d5ff;
  --drf-bg:           #faf5ff;
  --drf-label-color:  #6d28d9;
  --drf-text:         #1e1b4b;
  --drf-radius:       8px;
  --drf-shadow-focus: rgba(124, 58, 237, 0.2);

  // Estilos propios del form
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;

  &__success {
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 6px;
    color: #15803d;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }
}
```

### Variables `--drf-*` disponibles

| Variable | Default | Qué controla |
|----------|---------|-------------|
| `--drf-primary` | `#2563eb` | Focus, botón submit |
| `--drf-primary-hover` | `#1d4ed8` | Hover del botón |
| `--drf-border` | `#d9dee8` | Borde de inputs |
| `--drf-radius` | `6px` | Border radius |
| `--drf-bg` | `#ffffff` | Fondo de inputs |
| `--drf-text` | `#172033` | Texto dentro del input |
| `--drf-label-color` | `#172033` | Color de labels |
| `--drf-help-color` | `#667085` | Texto de descripción |
| `--drf-error` | `#dc2626` | Mensajes de error |
| `--drf-shadow-focus` | `rgba(59,130,246,.15)` | Sombra al hacer focus |
| `--drf-disabled-bg` | `#f3f4f6` | Fondo cuando disabled |

---

## Definición inline — evitar el fetch

Si el PHP puede proveer la definición del form (por ejemplo desde un preprocess hook), podés pasarla directamente en un atributo y React la usa sin hacer fetch a la API:

```twig
{# El JSON se serializa en Twig y React lo lee al montar #}
<div
  data-react-form
  data-form-id="dynamic:[nombre-form]"
  data-form-definition="{{ definicion_json|json_encode }}"
></div>
```

En el componente, chequeás si llegó la definición inline antes de hacer fetch:

```tsx
useEffect(() => {
  if (inlineDefinition) {
    setDefinition(inlineDefinition);
    setLoading(false);
    return;
  }
  fetch(`/api/react-form/dynamic/${FORM_ID}?_format=json`)
    // ...
}, [inlineDefinition]);
```

---

## API de referencia

```
GET  /api/react-form/dynamic/{form_id}?_format=json
     → Definición del form (elements con type, title, options, weight...)

GET  /api/react-form/dynamic/{form_id}/submissions?_format=json
     → Últimas 20 submissions ordenadas por fecha desc
     → [{ id, data: { campo: valor }, uid, created }]

POST /api/react-form/dynamic/{form_id}/submit?_format=json
     Header: X-CSRF-Token: {fetch('/session/token')}
     Body:   { "[campo_1]": "valor", "[campo_2]": "valor" }
     → { success: true, form_id: "..." }

GET  /api/react-form/user/{uid}?_format=json
     → Campos del form de edición de usuario

POST /api/react-form/user/{uid}/submit?_format=json
     → Guarda nombre, mail, contraseña, timezone, foto, roles

POST /api/react-form/user/{uid}/upload/picture
     Header: X-Filename: foto.jpg
     Body:   binary del archivo
     → { success: true, fid, url, name }
```

---

## Build

```bash
# Después de cualquier cambio en src/
lando pnpm --dir web/modules/custom/drupal_react_form/js/react-form build

# Limpiar caché de Drupal
lando drush cr
```

Output: `dist/react-form.js` + `dist/react-form.css`
