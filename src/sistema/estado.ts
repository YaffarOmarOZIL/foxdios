/** Estado global del sistema: fase (arranque/login/escritorio) y ventanas abiertas. */
import { create } from 'zustand';
import type { DefApp, IdApp } from '../apps/registro';
import { APPS } from '../apps/registro';
import { sonidos } from './sonido';

export type Fase = 'arranque' | 'login' | 'entrando' | 'escritorio' | 'apagando' | 'apagado';

export interface Ventana {
  id: string;
  app: IdApp;
  props: Record<string, unknown>;
  titulo?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimizada: boolean;
  maximizada: boolean;
  cerrando: boolean;
}

interface EstadoSistema {
  fase: Fase;
  ventanas: Ventana[];
  zTope: number;
  pantalla: { w: number; h: number };
  menuInicio: boolean;
  flip: { activo: boolean; indice: number };
  setFase: (f: Fase) => void;
  setPantalla: (w: number, h: number) => void;
  abrir: (app: IdApp, props?: Record<string, unknown>) => string;
  cerrar: (id: string) => void;
  cerrarTodas: () => void;
  enfocar: (id: string) => void;
  minimizar: (id: string) => void;
  alternarMax: (id: string) => void;
  mover: (id: string, cambios: Partial<Pick<Ventana, 'x' | 'y' | 'w' | 'h'>>) => void;
  setTitulo: (id: string, titulo: string) => void;
  setProps: (id: string, props: Record<string, unknown>) => void;
  setMenuInicio: (v: boolean) => void;
  mostrarEscritorio: () => void;
  setFlip: (activo: boolean, indice?: number) => void;
}

export const ALTO_BARRA = 44;
let contador = 0;

export const useSistema = create<EstadoSistema>((set, get) => ({
  fase: 'arranque',
  ventanas: [],
  zTope: 10,
  pantalla: { w: 1280, h: 720 },
  menuInicio: false,
  flip: { activo: false, indice: 0 },

  setFase: (fase) => set({ fase }),
  setPantalla: (w, h) => set({ pantalla: { w, h } }),

  abrir(app, props = {}) {
    const def: DefApp = APPS[app];
    const { ventanas, pantalla, zTope } = get();
    // Apps de una sola instancia: si ya está abierta, se enfoca (y se le pasan los props nuevos).
    if (def.unica) {
      const ya = ventanas.find((v) => v.app === app && !v.cerrando);
      if (ya) {
        set({
          ventanas: ventanas.map((v) =>
            v.id === ya.id ? { ...v, props: Object.keys(props).length ? { ...props, _t: Date.now() } : v.props, minimizada: false, z: zTope + 1 } : v,
          ),
          zTope: zTope + 1,
          menuInicio: false,
        });
        return ya.id;
      }
    }
    const altoUtil = pantalla.h - ALTO_BARRA;
    const w = Math.min(def.tam[0], pantalla.w - 20);
    const h = Math.min(def.tam[1], altoUtil - 20);
    const abiertas = ventanas.filter((v) => !v.cerrando).length;
    const desfase = (abiertas % 6) * 28;
    const x = Math.max(4, Math.round((pantalla.w - w) / 2 - 60 + desfase));
    const y = Math.max(4, Math.round((altoUtil - h) / 2 - 40 + desfase));
    const id = `v${++contador}`;
    sonidos.abrir();
    set({
      ventanas: [...ventanas, { id, app, props, x, y, w, h, z: zTope + 1, minimizada: false, maximizada: pantalla.w < 700, cerrando: false }],
      zTope: zTope + 1,
      menuInicio: false,
    });
    return id;
  },

  cerrar(id) {
    sonidos.cerrar();
    set({ ventanas: get().ventanas.map((v) => (v.id === id ? { ...v, cerrando: true } : v)) });
    setTimeout(() => set({ ventanas: get().ventanas.filter((v) => v.id !== id) }), 220);
  },

  cerrarTodas: () => set({ ventanas: [] }),

  enfocar(id) {
    const { ventanas, zTope } = get();
    const v = ventanas.find((x) => x.id === id);
    if (!v) return;
    if (v.z === zTope && !v.minimizada) return;
    set({ ventanas: ventanas.map((x) => (x.id === id ? { ...x, z: zTope + 1, minimizada: false } : x)), zTope: zTope + 1 });
  },

  minimizar(id) {
    sonidos.minimizar();
    set({ ventanas: get().ventanas.map((v) => (v.id === id ? { ...v, minimizada: true } : v)) });
  },

  alternarMax(id) {
    sonidos.maximizar();
    set({ ventanas: get().ventanas.map((v) => (v.id === id ? { ...v, maximizada: !v.maximizada } : v)) });
  },

  mover: (id, cambios) => set({ ventanas: get().ventanas.map((v) => (v.id === id ? { ...v, ...cambios } : v)) }),
  setTitulo: (id, titulo) => {
    if (get().ventanas.find((v) => v.id === id)?.titulo === titulo) return;
    set({ ventanas: get().ventanas.map((v) => (v.id === id ? { ...v, titulo } : v)) });
  },
  setProps: (id, props) => set({ ventanas: get().ventanas.map((v) => (v.id === id ? { ...v, props } : v)) }),

  setMenuInicio: (menuInicio) => {
    if (menuInicio) sonidos.menu();
    set({ menuInicio });
  },

  mostrarEscritorio() {
    const vs = get().ventanas;
    const todasMin = vs.every((v) => v.minimizada);
    set({ ventanas: vs.map((v) => ({ ...v, minimizada: !todasMin })), menuInicio: false });
  },

  setFlip(activo, indice) {
    const vivas = get().ventanas.filter((v) => !v.cerrando);
    if (activo && !vivas.length) return;
    if (activo) sonidos.maximizar();
    set({ flip: { activo, indice: indice ?? (activo ? 0 : get().flip.indice) }, menuInicio: false });
  },
}));

/** Ventana con el foco (la de más arriba que no está minimizada). */
export function ventanaActiva(ventanas: Ventana[]) {
  let top: Ventana | undefined;
  for (const v of ventanas) if (!v.minimizada && !v.cerrando && (!top || v.z > top.z)) top = v;
  return top;
}
