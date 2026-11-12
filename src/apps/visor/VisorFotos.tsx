import { useEffect, useRef, useState, type PointerEvent as PE } from 'react';
import { buscarNodo, url } from '../../contenido';
import type { NodoImagen } from '../../contenido/tipos';
import { useT } from '../../i18n';
import { sonidos } from '../../sistema/sonido';
import { useVentana } from '../../sistema/ventanas/contexto';
import './visor.css';

/**
 * Visor de fotos: primero muestra la miniatura (carga al instante) y luego
 * reemplaza por la imagen original a máxima calidad.
 */
export default function VisorFotos() {
  const { t } = useT();
  const ventana = useVentana();
  const lista = ((ventana.props.lista as string[]) ?? [ventana.props.ruta as string])
    .map((r) => buscarNodo(r))
    .filter((n): n is NodoImagen => n?.tipo === 'imagen');
  const [indice, setIndice] = useState(() => Math.max(0, lista.findIndex((n) => n.ruta === ventana.props.ruta)));
  const [zoom, setZoom] = useState(1);
  const [giro, setGiro] = useState(0);
  const [desp, setDesp] = useState({ x: 0, y: 0 });
  const [cargada, setCargada] = useState(false);
  const [presentacion, setPresentacion] = useState(false);
  const arrastre = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const foto = lista[indice];

  useEffect(() => {
    setCargada(false);
    setZoom(1);
    setGiro(0);
    setDesp({ x: 0, y: 0 });
    if (foto) ventana.setTitulo(foto.nombre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, foto?.ruta]);

  // Pre-cargar la siguiente foto para que el cambio sea instantáneo.
  useEffect(() => {
    const sig = lista[(indice + 1) % lista.length];
    if (sig && cargada) new Image().src = url(sig.url);
  }, [cargada, indice, lista]);

  useEffect(() => {
    if (!presentacion) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % lista.length), 3500);
    return () => clearInterval(id);
  }, [presentacion, lista.length]);

  const ir = (paso: number) => {
    if (lista.length < 2) return;
    sonidos.click();
    setIndice((i) => (i + paso + lista.length) % lista.length);
  };

  useEffect(() => {
    if (!ventana.activa) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
      if (e.key === '+') setZoom((z) => Math.min(6, z * 1.25));
      if (e.key === '-') setZoom((z) => Math.max(0.2, z / 1.25));
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  if (!foto) return <div className="visor"><div className="visor-escena" /></div>;

  const abajo = (e: PE) => {
    if (zoom <= 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY, dx: desp.x, dy: desp.y };
  };
  const mover = (e: PE) => {
    const a = arrastre.current;
    if (a) setDesp({ x: a.dx + e.clientX - a.x, y: a.dy + e.clientY - a.y });
  };
  const transformar = `translate(${desp.x}px, ${desp.y}px) scale(${zoom}) rotate(${giro}deg)`;

  return (
    <div className="visor">
      <div
        className={`visor-escena${zoom > 1 ? ' arrastrable' : ''}`}
        onWheel={(e) => setZoom((z) => Math.max(0.2, Math.min(6, z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))))}
        onPointerDown={abajo}
        onPointerMove={mover}
        onPointerUp={() => (arrastre.current = null)}
        onDoubleClick={() => (setZoom(zoom > 1 ? 1 : 2), setDesp({ x: 0, y: 0 }))}
      >
        <div
          className="visor-marco"
          style={{ transform: transformar, ['--ratio' as string]: foto.ancho / Math.max(1, foto.alto), ['--ancho' as string]: foto.ancho + 'px' }}
        >
          {/* Miniatura borrosa mientras carga el original */}
          <img className="visor-img visor-previa" src={url(foto.miniatura)} alt="" style={{ opacity: cargada ? 0 : 1 }} />
          <img
            key={foto.ruta}
            className={cargada ? 'visor-img visor-original lista' : 'visor-img visor-original'}
            src={url(foto.url)}
            alt={foto.nombre}
            onLoad={() => setCargada(true)}
            draggable={false}
          />
        </div>
        {!cargada && <div className="girando visor-cargando" />}
      </div>
      <div className="visor-barra">
        <span className="visor-info">
          {t('visor.de', { i: indice + 1, n: lista.length })} · {foto.ancho}×{foto.alto}
        </span>
        <div className="visor-controles">
          <button className="vc" title={t('visor.acercar')} onClick={() => setZoom((z) => Math.min(6, z * 1.25))}>＋</button>
          <button className="vc" title={t('visor.alejar')} onClick={() => setZoom((z) => Math.max(0.2, z / 1.25))}>－</button>
          <button className="vc" title={t('visor.ajustar')} onClick={() => (setZoom(1), setDesp({ x: 0, y: 0 }))}>⤢</button>
          <button className="vc vc-flecha" title={t('visor.anterior')} onClick={() => ir(-1)} disabled={lista.length < 2}>
            <svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button className={`vc vc-play${presentacion ? ' activo' : ''}`} title={t('visor.presentacion')} onClick={() => setPresentacion(!presentacion)} disabled={lista.length < 2}>
            {presentacion ? (
              <svg viewBox="0 0 16 16"><rect x="4" y="3" width="3" height="10" /><rect x="9" y="3" width="3" height="10" /></svg>
            ) : (
              <svg viewBox="0 0 16 16"><path d="M5 3l8 5-8 5z" /></svg>
            )}
          </button>
          <button className="vc vc-flecha" title={t('visor.siguiente')} onClick={() => ir(1)} disabled={lista.length < 2}>
            <svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" /></svg>
          </button>
          <button className="vc" title={t('visor.rotar')} onClick={() => setGiro((g) => g + 90)}>↻</button>
          <a className="vc" title={t('visor.original')} href={url(foto.url)} target="_blank" rel="noreferrer">⇱</a>
        </div>
      </div>
    </div>
  );
}
