/**
 * Iconos del escritorio. El orden de esta lista es el orden en pantalla (de arriba hacia abajo, columna por columna).
 * Las carpetas con "escritorio": true y los enlaces con "mostrar": ["escritorio"] se agregan solos después.
 */
import { carpetasEscritorio, enlaces } from '../../contenido';
import type { Texto } from '../../contenido/tipos';
import type { ClaveTexto } from '../../i18n';
import { abrirNodo } from '../acciones';
import { iconoDeNodo } from '../iconos/Icono';
import { useSistema } from '../estado';
import { usePrefs } from '../preferencias';

export interface ElementoEscritorio {
  id: string;
  icono: string;
  /** Imagen propia en vez de icono SVG (ej. logo de un enlace). */
  imagen?: string;
  titulo: ClaveTexto | { texto: Texto };
  abrir: () => void;
  /** Brilla para llamar la atención (se usa con el modo celular en pantallas táctiles). */
  llamativo?: boolean;
}

const abrir = (...a: Parameters<ReturnType<typeof useSistema.getState>['abrir']>) => useSistema.getState().abrir(...a);

export function elementosEscritorio(): ElementoEscritorio[] {
  const tactil = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  return [
    { id: 'movil', icono: 'celular', titulo: 'escritorio.modoCelular', llamativo: tactil, abrir: () => usePrefs.getState().cambiar('modo', 'movil') },
    { id: 'bienvenida', icono: 'bienvenida', titulo: 'apps.bienvenida', abrir: () => abrir('bienvenida') },
    { id: 'equipo', icono: 'equipo', titulo: 'apps.explorador', abrir: () => abrir('explorador', { ruta: '' }) },
    ...carpetasEscritorio.map<ElementoEscritorio>((c) => ({
      id: `c:${c.ruta}`,
      icono: iconoDeNodo(c),
      titulo: { texto: c.config.nombre ?? c.nombre },
      abrir: () => abrirNodo(c),
    })),
    { id: 'navegador', icono: 'navegador', titulo: 'apps.navegador', abrir: () => abrir('navegador') },
    { id: 'musica', icono: 'musica', titulo: 'apps.musica', abrir: () => abrir('musica') },
    ...enlaces
      .filter((e) => e.mostrar.includes('escritorio'))
      .map<ElementoEscritorio>((e) => ({ id: `e:${e.ruta}`, icono: 'enlace', imagen: e.icono, titulo: { texto: e.titulo }, abrir: () => abrirNodo(e) })),
    { id: 'asistente', icono: 'asistente', titulo: 'apps.asistente', abrir: () => usePrefs.getState().cambiar('asistente', true) },
    // Placeholders: cambia "proximamente" por tu app real cuando la tengas.
    { id: 'juegos', icono: 'juegos', titulo: 'apps.juegos', abrir: () => abrir('proximamente', { nombre: 'apps.juegos', icono: 'juegos' }) },
    { id: 'mensajero', icono: 'mensajero', titulo: 'apps.mensajero', abrir: () => abrir('proximamente', { nombre: 'apps.mensajero', icono: 'mensajero' }) },
    { id: 'configuracion', icono: 'configuracion', titulo: 'apps.configuracion', abrir: () => abrir('configuracion') },
    { id: 'papelera', icono: 'papelera', titulo: 'apps.papelera', abrir: () => abrir('explorador', { ruta: 'Papelera' }) },
  ];
}
