# Drupal React Form

Módulo Drupal 11 que expone formularios como JSON y los renderiza con React, dando control total sobre el markup desde el tema.

---

## Índice

1. [Cómo funciona](#cómo-funciona)
2. [Tipos de formularios](#tipos-de-formularios)
3. [Modo 1 — Genérico automático](#modo-1--genérico-automático)
4. [Modo 2 — Componente dedicado con markup custom](#modo-2--componente-dedicado-con-markup-custom)
5. [Formularios dinámicos desde el admin](#formularios-dinámicos-desde-el-admin)
6. [SDC Component en el tema](#sdc-component-en-el-tema)
7. [Componentes de campo disponibles](#componentes-de-campo-disponibles)
8. [Diseño y CSS por componente](#diseño-y-css-por-componente)
9. [API endpoints](#api-endpoints)
10. [Build del bundle](#build-del-bundle)
11. [Comandos útiles](#comandos-útiles)

---

## Cómo funciona

```
Drupal Form API / Admin Builder
         │
         ▼
   JSON via API
         │
         ▼
  React (bundle IIFE)
  index.tsx detecta data-form-id
         │
         ├── user:UID        → UserEditForm (componente dedicado)
         ├── dynamic:foo     → componente del DYNAMIC_REGISTRY, o DrupalForm genérico
         └── Drupal.M.F.Bar  → DrupalForm genérico
```

El bundle `dist/react-form.js` se carga una sola vez. Escanea todos los `[data-react-form]` de la página y monta el componente correspondiente en cada uno.

---

## Tipos de formularios

| Tipo | ID en `data-form-id` | Backend |
|------|---------------------|---------|
| Formulario Drupal Form API | `Drupal.mi_modulo.Form.MiForm` | Clase PHP |
| Edición de usuario | `user:42` | `UserReactFormController` |
| Formulario dinámico (admin) | `dynamic:mi_form` | Tabla `drupal_react_forms` |

---

## Modo 1 — Genérico automático

El modo más simple. El `DrupalForm` genérico fetchea la definición y renderiza todos los campos automáticamente.

### En Twig

```twig
<div
  data-react-form
  data-form-id="dynamic:nombre_del_proyecto"
></div>
{{ attach_library('drupal_react_form/react-form-app') }}
```

### Desde un controller PHP

```php
return [
  '#type'     => 'inline_template',
  '#template' => '<div data-react-form data-form-id="dynamic:mi_form"></div>',
  '#attached' => ['library' => ['drupal_react_form/react-form-app']],
];
```

### Como SDC del tema

```twig
{# En cualquier template .twig #}
{% include 'react_form_test:nombre-del-proyecto-form' with {
  title: 'Mi formulario',
} %}
```

**El orden visual de los campos lo define el `weight` de cada campo en el admin.**

---

## Modo 2 — Componente dedicado con markup custom

Cuando necesitás control total sobre el layout: columnas, secciones, agrupaciones, clases propias.

### Paso 1: Crear el formulario en el admin (si es dinámico)

`/admin/drupal-react-form/forms/add`

### Paso 2: Crear el componente React

```
js/react-form/src/features/MiForm/
  MiForm.tsx       ← aquí va el markup
  MiForm.scss      ← diseño exclusivo de este form
  index.ts
```

```tsx
// MiForm.tsx
import { useCallback, useEffect, useState } from 'react';
import TextField      from '../../components/TextField';
import EmailField     from '../../components/EmailField';
import SelectField    from '../../components/SelectField';
import SubmitButton   from '../../components/SubmitButton';
import type { DrupalElement, DrupalFormDefinition, FormValues } from '../../types/drupal-form';
import './MiForm.scss';

const FORM_ID = 'mi_form';  // mismo ID que en el admin
const SUBMIT_EL: DrupalElement = { key: 'submit', type: 'submit', value: 'Enviar' };

interface Props { baseUrl?: string; }

export function MiForm({ baseUrl = '' }: Props) {
  const [definition, setDefinition] = useState<DrupalFormDefinition | null>(null);
  const [values, setValues]         = useState<FormValues>({});
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // Cargar definición del form
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
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const csrf = await fetch(`${baseUrl}/session/token`).then(r => r.text()).catch(() => '');
    const res  = await fetch(`${baseUrl}/api/react-form/dynamic/${FORM_ID}/submit?_format=json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) setSubmitted(true);
    if (data.errors)  setErrors(data.errors);
    setSubmitting(false);
  };

  if (loading || !definition) return <div>Cargando...</div>;

  const fv    = { ...values, __submitting: submitting };
  const field = (name: string) => definition[name] ?? null;
  const props = (name: string) => ({
    name,
    element: definition[name],
    formValues: fv,
    onChange: (v: unknown) => handleChange(name, v),
    error: errors[name],
  });

  return (
    <form className="mf" onSubmit={handleSubmit} noValidate>

      {submitted && <div className="mf__success">Enviado correctamente.</div>}

      {/* ── Acá controlás el markup completamente ── */}

      <div className="mf__row">
        {field('nombre') && <TextField  {...props('nombre')} />}
        {field('email')  && <EmailField {...props('email')} />}
      </div>

      {field('categoria') && <SelectField {...props('categoria')} />}

      <div className="mf__actions">
        <SubmitButton name="submit" element={SUBMIT_EL} formValues={fv} onChange={() => {}} />
      </div>

    </form>
  );
}
```

```ts
// index.ts
export { MiForm } from './MiForm';
```

### Paso 3: Registrar en el registry de `index.tsx`

```tsx
// js/react-form/src/index.tsx
import { MiForm } from './features/MiForm';

const DYNAMIC_REGISTRY: Record<string, ComponentType<{ baseUrl?: string }>> = {
  nombre_del_proyecto: NombreDelProyectoForm,
  mi_form:             MiForm,             // ← agregar acá
};
```

Desde este momento `data-form-id="dynamic:mi_form"` monta `MiForm` en lugar del genérico.

### Paso 4: Build

```bash
lando pnpm --dir web/modules/custom/drupal_react_form/js/react-form build
lando drush cr
```

---

## Formularios dinámicos desde el admin

### Crear un form

1. Ir a **Estructura → Formularios React** (`/admin/drupal-react-form/forms`)
2. Click en **Agregar formulario**
3. Completar:
   - **Label**: nombre visible
   - **ID**: machine name (`[a-z0-9_]+`), no se puede cambiar después
4. Agregar campos con **+ Agregar campo**

### Tipos de campo disponibles

| Grupo | Tipos |
|-------|-------|
| Texto | `textfield`, `email`, `password`, `password_confirm`, `textarea`, `number`, `tel`, `url`, `search` |
| Selección | `select`, `checkbox`, `checkboxes`, `radio`, `radios` |
| Fecha | `date`, `datetime` |
| Archivo | `file`, `managed_file` |
| Layout | `fieldset`, `details`, `container` |
| Otros | `hidden`, `submit` |

### Opciones para select / checkboxes / radios

El campo **Opciones** aparece automáticamente cuando el tipo lo requiere. Formato: una opción por línea.

```
# Solo etiqueta (valor = etiqueta)
Opción uno
Opción dos

# Con valor separado por pipe
valor_1|Opción uno
valor_2|Opción dos
```

### Ver los datos guardados

Cada submit se guarda en `drupal_react_form_submissions`. Consultarlos:

```bash
lando drush ev "
  \$rows = \Drupal::database()
    ->select('drupal_react_form_submissions','s')
    ->fields('s')
    ->condition('form_id','mi_form')
    ->orderBy('created','DESC')
    ->execute()->fetchAll();
  foreach(\$rows as \$r) {
    echo date('Y-m-d H:i', \$r->created) . ' — ' . \$r->data . PHP_EOL;
  }
"
```

O via API:

```
GET /api/react-form/dynamic/{form_id}/submissions?_format=json
```

---

## SDC Component en el tema

Cada form puede tener su propio componente SDC en `components/features/`. Estructura mínima:

```
components/features/mi-form/
  mi-form.component.yml
  mi-form.twig
  mi-form.css
```

```yaml
# mi-form.component.yml
$schema: https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json
name: Mi Form
libraryOverrides:
  dependencies:
    - drupal_react_form/react-form-app
props:
  type: object
  additionalProperties: false
  properties:
    title:
      type: string
```

```twig
{# mi-form.twig #}
{{ attach_library('drupal_react_form/react-form-app') }}

<section class="mi-form">
  {% if title is defined and title %}
    <h2 class="mi-form__title">{{ title }}</h2>
  {% endif %}

  <div data-react-form data-form-id="dynamic:mi_form"></div>
</section>
```

Incluirlo desde cualquier template:

```twig
{% include 'react_form_test:mi-form' with { title: 'Contacto' } %}
```

### Pasar definición inline (evita el fetch a la API)

Si el PHP puede proveer los datos del form, pasarlos como JSON en `data-form-definition` elimina el round-trip a la API:

```twig
<div
  data-react-form
  data-form-id="dynamic:mi_form"
  data-form-definition="{{ definicion_json|json_encode }}"
></div>
```

React detecta el atributo y lo usa directamente, sin hacer fetch.

---

## Componentes de campo disponibles

Todos aceptan la misma interfaz `BaseFieldProps`:

```tsx
interface BaseFieldProps {
  name: string;
  element: DrupalElement;   // definición del campo (tipo, título, opciones, etc.)
  formValues: FormValues;   // estado completo del form
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
}
```

| Componente | Tipo Drupal | Import |
|-----------|------------|--------|
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

### Patrones de uso en el componente

```tsx
// Helper para verificar si el campo existe en la definición
const field = (name: string) => definition[name] ?? null;

// Helper para armar las props estándar
const props = (name: string) => ({
  name,
  element: definition[name],
  formValues: { ...values, __submitting: submitting },
  onChange: (v: unknown) => handleChange(name, v),
  error: errors[name],
});

// Renderizado condicional — solo muestra el campo si existe en la definición
{field('email') && <EmailField {...props('email')} />}

// Dos campos en la misma fila
<div className="mf__row">
  {field('nombre') && <TextField  {...props('nombre')} />}
  {field('email')  && <EmailField {...props('email')} />}
</div>

// Campo de submit personalizado (sin necesitar la definición)
const SUBMIT_EL: DrupalElement = { key: 'submit', type: 'submit', value: 'Enviar' };
<SubmitButton name="submit" element={SUBMIT_EL} formValues={fv} onChange={() => {}} />
```

---

## Diseño y CSS por componente

Cada componente dedicado tiene su propio SCSS que **override las variables `--drf-*`** en su scope. Esto permite que el mismo `TextField` se vea completamente diferente en cada form.

```scss
// MiForm.scss
.mf {
  // Override de variables para este form
  --drf-primary:     #7c3aed;  // violeta
  --drf-border:      #e9d5ff;
  --drf-bg:          #faf5ff;
  --drf-label-color: #6d28d9;
  --drf-text:        #1e1b4b;

  // Layout
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

  &__success {
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 6px;
    color: #15803d;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }
}
```

### Variables `--drf-*` disponibles

| Variable | Por defecto | Descripción |
|----------|------------|-------------|
| `--drf-primary` | `#2563eb` | Color de acento, focus, botón |
| `--drf-primary-hover` | `#1d4ed8` | Hover del botón |
| `--drf-border` | `#d9dee8` | Borde de inputs |
| `--drf-radius` | `6px` | Border radius |
| `--drf-bg` | `#ffffff` | Fondo de inputs |
| `--drf-text` | `#172033` | Color de texto en inputs |
| `--drf-label-color` | `#172033` | Color de labels |
| `--drf-help-color` | `#667085` | Color de texto de ayuda |
| `--drf-error` | `#dc2626` | Color de errores |
| `--drf-shadow-focus` | `rgba(59,130,246,.15)` | Sombra en focus |
| `--drf-disabled-bg` | `#f3f4f6` | Fondo cuando disabled |

---

## API endpoints

### Formularios dinámicos

```
GET  /api/react-form/dynamic/{form_id}?_format=json
     → Definición del form (campos, tipos, opciones)

GET  /api/react-form/dynamic/{form_id}/submissions?_format=json
     → Últimas 20 submissions (más reciente primero)

POST /api/react-form/dynamic/{form_id}/submit?_format=json
     Header: X-CSRF-Token: {token de /session/token}
     Body: JSON con los valores del form
     → { success: true, form_id: "..." }
```

### Usuario

```
GET  /api/react-form/user/{uid}?_format=json
     → Campos del form de edición de usuario

POST /api/react-form/user/{uid}/submit?_format=json
     → Guarda nombre, mail, contraseña, zona horaria, foto, roles

POST /api/react-form/user/{uid}/upload/picture
     Header: X-Filename: foto.jpg
     Body: binary del archivo
     → { success: true, fid: 42, url: "...", name: "foto.jpg" }
```

### Drupal Form API (clases PHP)

```
GET  /api/react-form/{form_id}?_format=json
     form_id = "Drupal.mi_modulo.Form.MiForm"
     → Serialización de la Form API a JSON

POST /api/react-form/{form_id}/submit?_format=json
     → Respuesta genérica (implementar lógica custom en el controller)
```

---

## Build del bundle

```bash
# Primera vez
lando pnpm --dir web/modules/custom/drupal_react_form/js/react-form install

# Después de cualquier cambio en /js/react-form/src/
lando pnpm --dir web/modules/custom/drupal_react_form/js/react-form build

# Limpiar caché de Drupal
lando drush ev "opcache_reset();"
lando drush cr
```

Output: `dist/react-form.js` (~238KB) + `dist/react-form.css` (~22KB)

---

## Comandos útiles

```bash
# Ver formularios creados desde el admin
lando drush ev "print_r(\Drupal::service('drupal_react_form.dynamic_form_storage')->loadAll());"

# Ver submissions de un form
lando drush ev "
  \$rows = \Drupal::database()->select('drupal_react_form_submissions','s')
    ->fields('s')->condition('form_id','mi_form')
    ->orderBy('created','DESC')->range(0,5)->execute()->fetchAll();
  foreach(\$rows as \$r) echo date('d/m H:i',\$r->created).' '.\$r->data.PHP_EOL;
"

# Testear el endpoint de definición
curl "http://drupal-react-form.lndo.site:8080/api/react-form/dynamic/mi_form?_format=json" | python3 -m json.tool

# Testear el endpoint de submissions
curl "http://drupal-react-form.lndo.site:8080/api/react-form/dynamic/mi_form/submissions?_format=json" | python3 -m json.tool

# Resetear OPcache después de cambios PHP
lando drush ev "opcache_reset(); echo 'cleared';"
```
