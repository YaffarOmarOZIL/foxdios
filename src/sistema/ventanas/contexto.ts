import { createContext, useContext } from 'react';

/** Lo que una app puede hacer con su propia ventana. */
export interface ContextoVentana {
  id: string;
  props: Record<string, unknown>;
  setTitulo: (t: string) => void;
  setProps: (p: Record<string, unknown>) => void;
  cerrar: () => void;
  activa: boolean;
  movil: boolean;
}

export const VentanaCtx = createContext<ContextoVentana | null>(null);

export function useVentana() {
  const c = useContext(VentanaCtx);
  if (!c) throw new Error('useVentana debe usarse dentro de una ventana');
  return c;
}
