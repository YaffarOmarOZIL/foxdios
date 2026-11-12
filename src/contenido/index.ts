// Acceso al "disco duro": el manifiesto que genera scripts/plugin-contenido.ts a partir de contenido/.
import manifiesto from 'virtual:contenido';
import type { Nodo, NodoAudio, NodoCarpeta, NodoEnlace, NodoImagen, NodoWeb } from './tipos';

export const raiz = manifiesto.raiz;
export const datosAsistente = manifiesto.asistente;
export const configSistema = manifiesto.config;

/** Convierte una url del manifiesto en una url utilizable (respeta la base de la web). */
export function url(u: string | undefined): string {
  if (!u) return '';
  if (/^(https?:|data:|blob:)/.test(u)) return u;
  return import.meta.env.BASE_URL + u;
}

const indice = new Map<string, Nodo>();
const padres = new Map<string, NodoCarpeta>();
(function indexar(c: NodoCarpeta) {
  indice.set(c.ruta, c);
  for (const h of c.hijos) {
    padres.set(h.ruta, c);
    if (h.tipo === 'carpeta') indexar(h);
    else indice.set(h.ruta, h);
  }
})(raiz);

export const buscarNodo = (ruta: string) => indice.get(ruta.replace(/^\/+|\/+$/g, ''));
export const padreDe = (ruta: string) => padres.get(ruta);
export const todosLosNodos = () => [...indice.values()];

function recolectar<T extends Nodo>(filtro: (n: Nodo, carpeta: NodoCarpeta) => n is T): T[] {
  const out: T[] = [];
  (function rec(c: NodoCarpeta) {
    for (const h of c.hijos) {
      if (filtro(h, c)) out.push(h);
      if (h.tipo === 'carpeta') rec(h);
    }
  })(raiz);
  return out;
}

export const canciones = recolectar((n): n is NodoAudio => n.tipo === 'audio');
export const webs = recolectar((n): n is NodoWeb => n.tipo === 'web');
export const enlaces = recolectar((n): n is NodoEnlace => n.tipo === 'enlace');
export const imagenesPuzzle = recolectar((n, c): n is NodoImagen => n.tipo === 'imagen' && !!c.config.puzzle);
export const imagenesFondo = recolectar((n, c): n is NodoImagen => n.tipo === 'imagen' && !!c.config.fondos);
export const todasLasImagenes = recolectar(
  (n, c): n is NodoImagen => n.tipo === 'imagen' && !c.config.oculta && !c.config.fondos,
);
export const carpetasEscritorio = recolectar((n): n is NodoCarpeta => n.tipo === 'carpeta' && !!n.config.escritorio);

/** Hijos visibles (sin carpetas ocultas). */
export const hijosVisibles = (c: NodoCarpeta) => c.hijos.filter((h) => !(h.tipo === 'carpeta' && h.config.oculta));

export function formatoPeso(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Busca una web por lo que el visitante escribió en la barra de direcciones. */
export function buscarWeb(texto: string): NodoWeb | undefined {
  const limpio = texto.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
  if (!limpio) return undefined;
  return webs.find((w) => w.dominio === limpio) ?? webs.find((w) => w.dominio.split('.')[0] === limpio);
}
