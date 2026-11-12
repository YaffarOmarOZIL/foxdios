import { memo, Suspense, useCallback, useMemo, useRef, type ComponentType, type CSSProperties, type PointerEvent as PE } from 'react';
import { APPS } from '../../apps/registro';
import { useT } from '../../i18n';
import { ALTO_BARRA, useSistema, type Ventana as TVentana } from '../estado';
import { Icono } from '../iconos/Icono';
import { sonidos } from '../sonido';
import { VentanaCtx, type ContextoVentana } from './contexto';
import './ventanas.css';

const MIN_W = 300;
const MIN_H = 200;
type Borde = 'n' | 's' | 'e' | 'o' | 'ne' | 'no' | 'se' | 'so';

interface Props {
  v: TVentana;
  activa: boolean;
  estiloFlip?: CSSProperties;
  enFlip: boolean;
}

/**
 * Optimización: memo hace que, al mover una ventana, las demás no se vuelvan a dibujar.
 */
export const Ventana = memo(function Ventana({ v, activa, estiloFlip, enFlip }: Props) {
  const { t } = useT();
  const def = APPS[v.app];
  const { enfocar, cerrar, minimizar, alternarMax, mover, setTitulo, setProps } = useSistema.getState();
  const pantallaW = useSistema((s) => s.pantalla.w);
  const pantallaH = useSistema((s) => s.pantalla.h);
  const arrastre = useRef<{ px: number; py: number; x: number; y: number; w: number; h: number; k: number; borde?: Borde } | null>(null);
  // Los movimientos del mouse se juntan y se aplican una vez por cuadro de pantalla.
  const pendiente = useRef<{ cambios: Partial<Pick<TVentana, 'x' | 'y' | 'w' | 'h'>>; raf: number } | null>(null);
  const aplicar = useCallback((cambios: Partial<Pick<TVentana, 'x' | 'y' | 'w' | 'h'>>) => {
    if (pendiente.current) {
      pendiente.current.cambios = cambios;
      return;
    }
    pendiente.current = {
      cambios,
      raf: requestAnimationFrame(() => {
        const p = pendiente.current;
        pendiente.current = null;
        if (p) mover(v.id, p.cambios);
      }),
    };
  }, [mover, v.id]);
  const vaciar = () => {
    const p = pendiente.current;
    if (!p) return;
    cancelAnimationFrame(p.raf);
    pendiente.current = null;
    mover(v.id, p.cambios);
  };

  const ctx = useMemo(
    () => ({
      id: v.id,
      props: v.props,
      activa,
      movil: false,
      setTitulo: (titulo: string) => setTitulo(v.id, titulo),
      setProps: (p: Record<string, unknown>) => setProps(v.id, p),
      cerrar: () => cerrar(v.id),
    }),
    [v.id, v.props, activa, setTitulo, setProps, cerrar],
  );

  const iniciar = useCallback(
    (e: PE, borde?: Borde) => {
      if (e.button !== 0 || (v.maximizada && borde)) return;
      e.stopPropagation();
      enfocar(v.id);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* algunos navegadores no permiten capturar el puntero: se sigue igual */
      }
      // La pantalla puede estar escalada (monitor 4:3/16:9): se mide una sola vez al empezar.
      const ancho = (e.currentTarget as HTMLElement).closest('.pantalla')?.getBoundingClientRect().width || pantallaW;
      arrastre.current = { px: e.clientX, py: e.clientY, x: v.x, y: v.y, w: v.w, h: v.h, k: pantallaW / ancho, borde };
    },
    [v, enfocar, pantallaW],
  );

  const moverPuntero = useCallback(
    (e: PE) => {
      const a = arrastre.current;
      if (!a) return;
      const k = a.k;
      const dx = (e.clientX - a.px) * k;
      const dy = (e.clientY - a.py) * k;
      if (!a.borde) {
        if (v.maximizada) {
          // Arrastrar una ventana maximizada la restaura (como en Windows).
          if (Math.abs(dy) < 6) return;
          vaciar();
          alternarMax(v.id);
          const nx = Math.max(0, Math.min(pantallaW - a.w, a.px * k - a.w / 2));
          arrastre.current = { ...a, x: nx, y: 0, px: e.clientX, py: e.clientY };
          mover(v.id, { x: nx, y: 0 });
          return;
        }
        const x = Math.min(Math.max(a.x + dx, -a.w + 80), pantallaW - 80);
        const y = Math.min(Math.max(a.y + dy, 0), pantallaH - ALTO_BARRA - 30);
        aplicar({ x, y });
        return;
      }
      let { x, y, w, h } = a;
      if (a.borde.includes('e')) w = Math.max(MIN_W, a.w + dx);
      if (a.borde.includes('s')) h = Math.max(MIN_H, a.h + dy);
      if (a.borde.includes('o')) {
        w = Math.max(MIN_W, a.w - dx);
        x = a.x + a.w - w;
      }
      if (a.borde.includes('n')) {
        h = Math.max(MIN_H, a.h - dy);
        y = Math.max(0, a.y + a.h - h);
      }
      aplicar({ x, y, w, h });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v, aplicar, alternarMax, pantallaW, pantallaH],
  );

  const terminar = useCallback(() => {
    const a = arrastre.current;
    arrastre.current = null;
    vaciar();
    const actual = useSistema.getState().ventanas.find((x) => x.id === v.id);
    // Soltar arriba del todo = maximizar (Aero Snap)
    if (a && actual && !a.borde && !actual.maximizada && actual.y <= 0) {
      alternarMax(v.id);
      mover(v.id, { y: 20 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, alternarMax, mover]);

  const Componente = def.componente;
  const titulo = v.titulo || t(def.titulo);
  const clases = [
    'ventana',
    activa && 'activa',
    v.maximizada && 'maximizada',
    v.minimizada && 'minimizada',
    v.cerrando && 'cerrando',
    enFlip && 'en-flip',
  ]
    .filter(Boolean)
    .join(' ');

  const estilo: CSSProperties = v.maximizada
    ? { left: 0, top: 0, width: pantallaW, height: pantallaH - ALTO_BARRA, zIndex: v.z }
    : { left: v.x, top: v.y, width: v.w, height: v.h, zIndex: v.z };

  return (
    <div
      className={clases}
      style={{ ...estilo, ...estiloFlip }}
      onPointerDownCapture={() => !enFlip && enfocar(v.id)}
      onClickCapture={(e) => {
        if (enFlip) {
          e.stopPropagation();
          e.preventDefault();
          useSistema.getState().setFlip(false);
          enfocar(v.id);
        }
      }}
      role="dialog"
      aria-label={titulo}
      data-ventana={v.id}
    >
      <div
        className="ventana-titulo"
        onPointerDown={(e) => iniciar(e)}
        onPointerMove={moverPuntero}
        onPointerUp={terminar}
        onDoubleClick={() => alternarMax(v.id)}
      >
        <Icono nombre={def.icono} tam={18} />
        <span className="ventana-texto">{titulo}</span>
        <div className="ventana-botones" onPointerDown={(e) => e.stopPropagation()}>
          <button className="vb vb-min" title={t('ventana.minimizar')} onClick={() => minimizar(v.id)}>
            <svg viewBox="0 0 10 10"><rect x="1" y="6.5" width="8" height="2" rx=".5" /></svg>
          </button>
          <button className="vb vb-max" title={t(v.maximizada ? 'ventana.restaurar' : 'ventana.maximizar')} onClick={() => alternarMax(v.id)}>
            {v.maximizada ? (
              <svg viewBox="0 0 10 10"><path d="M3 1h6v6H7.5V2.5H3z M1 3h6v6H1z M2.3 4.6v3.1h3.4V4.6z" fillRule="evenodd" /></svg>
            ) : (
              <svg viewBox="0 0 10 10"><path d="M1 1h8v8H1z M2.4 3v4.6h5.2V3z" fillRule="evenodd" /></svg>
            )}
          </button>
          <button className="vb vb-cerrar" title={t('ventana.cerrar')} onClick={() => cerrar(v.id)}>
            <svg viewBox="0 0 10 10"><path d="M2 1l3 3 3-3 1 1-3 3 3 3-1 1-3-3-3 3-1-1 3-3-3-3z" /></svg>
          </button>
        </div>
      </div>
      <div className="ventana-cuerpo" onPointerDown={() => sonidos.click()}>
        <CuerpoVentana ctx={ctx} Componente={Componente} textoCargando={t('ventana.cargando')} />
      </div>
      {!v.maximizada &&
        (['n', 's', 'e', 'o', 'ne', 'no', 'se', 'so'] as Borde[]).map((b) => (
          <div key={b} className={`borde borde-${b}`} onPointerDown={(e) => iniciar(e, b)} onPointerMove={moverPuntero} onPointerUp={terminar} />
        ))}
    </div>
  );
});

/**
 * El contenido de la app. Va aparte y con memo: mover o redimensionar la ventana no vuelve a dibujar la app.
 */
const CuerpoVentana = memo(function CuerpoVentana({ ctx, Componente, textoCargando }: { ctx: ContextoVentana; Componente: ComponentType; textoCargando: string }) {
  return (
    <VentanaCtx.Provider value={ctx}>
      <Suspense
        fallback={
          <div className="ventana-cargando">
            <div className="girando" />
            {textoCargando}
          </div>
        }
      >
        <Componente />
      </Suspense>
    </VentanaCtx.Provider>
  );
});
