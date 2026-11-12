/**
 * Lista de programas de FoxdiOS. Para crear una app nueva:
 *  1. Crea su carpeta en src/apps/miApp/MiApp.tsx (exporta el componente por defecto).
 *  2. Agrégala aquí con su icono y tamaño.
 *  3. Pon su nombre en src/i18n/en.ts y es.ts ('apps.miApp').
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ClaveTexto } from '../i18n';

export interface DefApp {
  titulo: ClaveTexto;
  icono: string;
  tam: [number, number];
  unica?: boolean;
  componente: LazyExoticComponent<ComponentType>;
}

export const APPS = {
  bienvenida: {
    titulo: 'apps.bienvenida', icono: 'bienvenida', tam: [780, 580], unica: true,
    componente: lazy(() => import('./bienvenida/Bienvenida')),
  },
  explorador: {
    titulo: 'apps.explorador', icono: 'equipo', tam: [860, 560],
    componente: lazy(() => import('./explorador/Explorador')),
  },
  visor: {
    titulo: 'apps.visor', icono: 'imagen', tam: [860, 620],
    componente: lazy(() => import('./visor/VisorFotos')),
  },
  lector: {
    titulo: 'apps.lector', icono: 'documento', tam: [760, 600],
    componente: lazy(() => import('./lector/Lector')),
  },
  navegador: {
    titulo: 'apps.navegador', icono: 'navegador', tam: [1000, 660], unica: true,
    componente: lazy(() => import('./navegador/Navegador')),
  },
  musica: {
    titulo: 'apps.musica', icono: 'musica', tam: [440, 560], unica: true,
    componente: lazy(() => import('./musica/Reproductor')),
  },
  configuracion: {
    titulo: 'apps.configuracion', icono: 'configuracion', tam: [720, 540], unica: true,
    componente: lazy(() => import('./configuracion/Configuracion')),
  },
  proximamente: {
    titulo: 'apps.proximamente', icono: 'proximamente', tam: [420, 320],
    componente: lazy(() => import('./proximamente/Proximamente')),
  },
} satisfies Record<string, DefApp>;

export type IdApp = keyof typeof APPS;
