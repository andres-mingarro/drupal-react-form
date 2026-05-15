import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './DateListField.scss';

interface DateParts { year?: string; month?: string; day?: string; hour?: string; minute?: string; }

export function DateListField({ name, element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;
  const current = ((formValues[name] as DateParts) ?? {}) as DateParts;
  const showTime = element.attributes?.granularity === 'time';

  const now = new Date().getFullYear();
  const years = Array.from({ length: 111 }, (_, i) => String(now - 100 + i));
  const months = [
    ['1','Enero'],['2','Febrero'],['3','Marzo'],['4','Abril'],
    ['5','Mayo'],['6','Junio'],['7','Julio'],['8','Agosto'],
    ['9','Septiembre'],['10','Octubre'],['11','Noviembre'],['12','Diciembre'],
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const update = (part: keyof DateParts, val: string) => {
    onChange({ ...current, [part]: val });
  };

  return (
    <fieldset className={`drf-field drf-field--datelist${hasError ? ' drf-field--error' : ''}`}>
      {element.title && (
        <legend className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </legend>
      )}
      <div className="drf-field--datelist__selects">
        <select className="drf-field--datelist__select" value={current.day ?? ''} disabled={isDisabled}
          onChange={e => update('day', e.target.value)} aria-label="Día">
          <option value="">Día</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="drf-field--datelist__select" value={current.month ?? ''} disabled={isDisabled}
          onChange={e => update('month', e.target.value)} aria-label="Mes">
          <option value="">Mes</option>
          {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="drf-field--datelist__select drf-field--datelist__select--year" value={current.year ?? ''} disabled={isDisabled}
          onChange={e => update('year', e.target.value)} aria-label="Año">
          <option value="">Año</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {showTime && (
          <>
            <select className="drf-field--datelist__select" value={current.hour ?? ''} disabled={isDisabled}
              onChange={e => update('hour', e.target.value)} aria-label="Hora">
              <option value="">HH</option>
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="drf-field--datelist__sep">:</span>
            <select className="drf-field--datelist__select" value={current.minute ?? ''} disabled={isDisabled}
              onChange={e => update('minute', e.target.value)} aria-label="Minuto">
              <option value="">MM</option>
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </>
        )}
      </div>
      {element.description && <p className="drf-field__description">{element.description}</p>}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </fieldset>
  );
}
