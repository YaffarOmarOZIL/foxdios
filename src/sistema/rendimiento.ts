/**
 * Ayudas de rendimiento. "Liviano" = celulares y pantallas táctiles, donde ahorramos trabajo a la tarjeta gráfica.
 */
import { useEffect, useState } from 'react';
import { ALTO_BARRA, useSistema, type Ventana } from './estado';
import { usePrefs } from './preferencias';

const consulta = () => typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || window.innerWidth < 700);

/** true en celulares/tablets: se usan efectos más livianos con el mismo aspecto. */
export function useLiviano() {
  const modo = usePrefs((s) => s.modo);
  const [tactil, setTactil] = useState(consulta);
  useEffect(() => {
    const f = () => setTactil(consulta());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return tactil || modo === 'movil';
}

/** ¿Hay algo tapando todo el fondo? (una app a pantalla completa). Así las burbujas pueden descansar. */
export function fondoCubierto(ventanas: Ventana[], movil: boolean, pantalla: { w: number; h: number }) {
  return ventanas.some((v) => {
    if (v.minimizada || v.cerrando) return false;
    if (movil || v.maximizada) return true;
    return v.x <= 0 && v.y <= 0 && v.w >= pantalla.w && v.h >= pantalla.h - ALTO_BARRA;
  });
}

/** Hook: true cuando el fondo no se ve (app a pantalla completa o Flip 3D no cuenta). */
export function useFondoCubierto() {
  const movil = usePrefs((s) => s.modo === 'movil');
  return useSistema((s) => !s.flip.activo && fondoCubierto(s.ventanas, movil, s.pantalla));
}
