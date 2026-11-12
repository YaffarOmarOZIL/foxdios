import { useEffect, useMemo, useState, type PointerEvent as PE } from 'react';
import { url } from '../../contenido';
import { useT } from '../../i18n';
import { ALTO_BARRA, useSistema } from '../estado';
import { Icono } from '../iconos/Icono';
import { usePrefs } from '../preferencias';
import { sonidos } from '../sonido';
import { elementosEscritorio, type ElementoEscritorio } from './elementos';
import './escritorio.css';

const CELDA_W = 92;
const CELDA_H = 98;

export function Escritorio() {
  const { t, tx } = useT();
  const pantalla = useSistema((s) => s.pantalla);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [refresco, setRefresco] = useState(0);
  const elementos = useMemo(() => elementosEscritorio(), []);
  const filas = Math.max(1, Math.floor((pantalla.h - ALTO_BARRA - 16) / CELDA_H));

  useEffect(() => {
    if (!menu) return;
    const cerrar = () => setMenu(null);
    window.addEventListener('pointerdown', cerrar);
    return () => window.removeEventListener('pointerdown', cerrar);
  }, [menu]);

  const titulo = (e: ElementoEscritorio) => (typeof e.titulo === 'string' ? t(e.titulo) : tx(e.titulo.texto));

  const alPresionar = (ev: PE, e: ElementoEscritorio) => {
    ev.stopPropagation();
    sonidos.click();
    setSeleccion(e.id);
    // En pantallas táctiles basta un toque para abrir.
    if (ev.pointerType === 'touch') e.abrir();
  };

  const prefs = usePrefs();

  return (
    <div
      className="escritorio"
      onPointerDown={() => {
        setSeleccion(null);
        useSistema.getState().setMenuInicio(false);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        setMenu({ x: Math.min(e.clientX - r.left, r.width - 220), y: Math.min(e.clientY - r.top, r.height - 200) });
      }}
    >
      <div className="iconos-escritorio" key={refresco} style={{ gridTemplateRows: `repeat(${filas}, ${CELDA_H}px)` }}>
        {elementos.map((e, i) => (
          <button
            key={e.id}
            className={`icono-escritorio${seleccion === e.id ? ' seleccionado' : ''}${e.llamativo ? ' llamativo' : ''}`}
            style={{ animationDelay: `${i * 35}ms`, width: CELDA_W }}
            onPointerDown={(ev) => alPresionar(ev, e)}
            onDoubleClick={() => e.abrir()}
            onKeyDown={(ev) => ev.key === 'Enter' && e.abrir()}
          >
            <span className="icono-escritorio-img">
              {e.imagen ? <img src={url(e.imagen)} alt="" width={48} height={48} /> : <Icono nombre={e.icono} tam={48} />}
            </span>
            <span className="icono-escritorio-texto">{titulo(e)}</span>
          </button>
        ))}
      </div>

      {menu && (
        <div className="menu-contextual" style={{ left: menu.x, top: menu.y }} onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => (setRefresco((r) => r + 1), setMenu(null))}>{t('escritorio.actualizar')}</button>
          <hr />
          <button onClick={() => (prefs.cambiar('gadgets', !prefs.gadgets), setMenu(null))}>
            {t(prefs.gadgets ? 'escritorio.ocultarGadgets' : 'escritorio.gadgets')}
          </button>
          <div className="submenu">
            <span>{t('escritorio.formato')}</span>
            {(['completa', '16:9', '4:3'] as const).map((a) => (
              <button key={a} className={prefs.aspecto === a ? 'marcado' : ''} onClick={() => (prefs.cambiar('aspecto', a), setMenu(null))}>
                {a === 'completa' ? t('config.completa') : a}
              </button>
            ))}
          </div>
          <hr />
          <button onClick={() => (useSistema.getState().abrir('configuracion'), setMenu(null))}>
            <Icono nombre="configuracion" tam={16} /> {t('escritorio.personalizar')}
          </button>
        </div>
      )}
    </div>
  );
}
