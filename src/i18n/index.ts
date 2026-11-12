import { useMemo } from 'react';
import { usePrefs } from '../sistema/preferencias';
import type { Texto } from '../contenido/tipos';
import en, { type ClaveTexto } from './en';
import es from './es';

export type Idioma = 'en' | 'es';

export function traducir(idioma: Idioma, clave: ClaveTexto, vars?: Record<string, string | number>) {
  let s: string = (idioma === 'es' && es[clave]) || en[clave] || clave;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Elige el idioma correcto de un texto de contenido. */
export function textoDe(idioma: Idioma, t: Texto | undefined, respaldo = ''): string {
  if (!t) return respaldo;
  if (typeof t === 'string') return t;
  return t[idioma] || t.en || t.es || respaldo;
}

/** Hook para usar textos traducidos en componentes. */
export function useT() {
  const idioma = usePrefs((s) => s.idioma);
  // Memorizado por idioma: así t y tx solo cambian cuando cambia el idioma.
  return useMemo(
    () => ({
      idioma,
      t: (clave: ClaveTexto, vars?: Record<string, string | number>) => traducir(idioma, clave, vars),
      tx: (texto: Texto | undefined, respaldo = '') => textoDe(idioma, texto, respaldo),
    }),
    [idioma],
  );
}

export type { ClaveTexto };
