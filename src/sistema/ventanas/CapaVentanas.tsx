import { useEffect, useMemo, type CSSProperties } from 'react';
import { useT } from '../../i18n';
import { ALTO_BARRA, useSistema, ventanaActiva } from '../estado';
import { sonidos } from '../sonido';
import { Ventana } from './Ventana';

/** Dibuja todas las ventanas abiertas y el selector Flip 3D. */
export function CapaVentanas() {
  const { t } = useT();
  const ventanas = useSistema((s) => s.ventanas);
  const flip = useSistema((s) => s.flip);
  const pantalla = useSistema((s) => s.pantalla);
  const activa = ventanaActiva(ventanas);

  // Orden del Flip 3D: de la más reciente a la más antigua.
  const orden = useMemo(() => ventanas.filter((v) => !v.cerrando).sort((a, b) => b.z - a.z), [ventanas]);

  useEffect(() => {
    if (!flip.activo) return;
    const n = orden.length;
    if (!n) return useSistema.getState().setFlip(false);
    const elegir = (i: number) => {
      const v = orden[((i % n) + n) % n];
      useSistema.getState().setFlip(false);
      if (v) useSistema.getState().enfocar(v.id);
    };
    const tecla = (e: KeyboardEvent) => {
      const { indice } = useSistema.getState().flip;
      if (e.key === 'Escape') useSistema.getState().setFlip(false);
      else if (e.key === 'Enter') elegir(indice);
      else if (['ArrowRight', 'ArrowDown', 'Tab'].includes(e.key)) {
        e.preventDefault();
        sonidos.click();
        useSistema.getState().setFlip(true, (indice + 1) % n);
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        sonidos.click();
        useSistema.getState().setFlip(true, (indice - 1 + n) % n);
      }
    };
    let ultimo = 0;
    const rueda = (e: WheelEvent) => {
      if (Date.now() - ultimo < 120) return;
      ultimo = Date.now();
      const { indice } = useSistema.getState().flip;
      sonidos.click();
      useSistema.getState().setFlip(true, (indice + (e.deltaY > 0 ? 1 : -1) + n) % n);
    };
    window.addEventListener('keydown', tecla);
    window.addEventListener('wheel', rueda);
    return () => {
      window.removeEventListener('keydown', tecla);
      window.removeEventListener('wheel', rueda);
    };
  }, [flip.activo, orden]);

  const estiloFlip = (id: string): CSSProperties | undefined => {
    if (!flip.activo) return undefined;
    const n = orden.length;
    const i = orden.findIndex((v) => v.id === id);
    const v = orden[i];
    if (i < 0 || !v) return undefined;
    const d = (i - flip.indice + n) % n; // 0 = la de adelante
    const alto = pantalla.h - ALTO_BARRA;
    const w = v.maximizada ? pantalla.w : v.w;
    const h = v.maximizada ? alto : v.h;
    const x = v.maximizada ? 0 : v.x;
    const y = v.maximizada ? 0 : v.y;
    const escala = Math.min(0.62, (pantalla.w * 0.55) / w, (alto * 0.55) / h);
    const tx = pantalla.w * 0.4 - (x + w / 2) + d * 75;
    const ty = alto * 0.52 - (y + h / 2) - d * 42;
    return {
      transform: `translate3d(${tx}px, ${ty}px, ${-d * 210}px) rotateY(28deg) scale(${escala})`,
      zIndex: 1000 - d,
      opacity: d > 6 ? 0 : 1,
      filter: d ? `brightness(${1 - d * 0.06})` : undefined,
    };
  };

  return (
    <>
      {flip.activo && (
        <>
          <div className="flip-fondo" onClick={() => useSistema.getState().setFlip(false)} />
          <div className="flip-ayuda">{t('flip.ayuda')}</div>
        </>
      )}
      <div className={`capa-ventanas${flip.activo ? ' flip' : ''}`}>
        {ventanas.map((v) => (
          <Ventana
            key={v.id}
            v={v}
            activa={v.id === activa?.id && !flip.activo}
            enFlip={flip.activo}
            estiloFlip={estiloFlip(v.id)}
          />
        ))}
      </div>
    </>
  );
}
