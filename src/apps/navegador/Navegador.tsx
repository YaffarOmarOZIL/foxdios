/**
 * Navegador AeroNet: abre las webs estáticas de contenido/Webs en pestañas.
 * Cada web corre aislada (iframe con sandbox), así no puede romper el resto del portfolio.
 */
import { useEffect, useRef, useState } from 'react';
import { buscarWeb, url, webs } from '../../contenido';
import type { NodoWeb } from '../../contenido/tipos';
import { useT } from '../../i18n';
import { Icono } from '../../sistema/iconos/Icono';
import { sonidos } from '../../sistema/sonido';
import { useVentana } from '../../sistema/ventanas/contexto';
import './navegador.css';

const PORTAL = 'aeronet://portal';
interface Pestana {
  id: number;
  historial: string[];
  pos: number;
  cargando: boolean;
  recarga: number;
}
let siguienteId = 1;
const nuevaPestana = (dir = PORTAL): Pestana => ({ id: siguienteId++, historial: [dir], pos: 0, cargando: dir !== PORTAL, recarga: 0 });

export default function Navegador() {
  const { t, tx } = useT();
  const ventana = useVentana();
  const [pestanas, setPestanas] = useState<Pestana[]>(() => {
    const d = ventana.props.dominio as string | undefined;
    return [nuevaPestana(d ?? PORTAL)];
  });
  const [activaId, setActivaId] = useState(pestanas[0].id);
  const activa = pestanas.find((p) => p.id === activaId) ?? pestanas[0];
  const direccionActual = activa.historial[activa.pos];
  const [barra, setBarra] = useState(direccionActual === PORTAL ? '' : direccionActual);

  useEffect(() => setBarra(direccionActual === PORTAL ? '' : direccionActual), [direccionActual, activaId]);

  // Abrir una web pedida desde el explorador u otra app (abre pestaña nueva).
  const ultimaPeticion = useRef(ventana.props._t);
  useEffect(() => {
    if (ventana.props._t === ultimaPeticion.current) return;
    ultimaPeticion.current = ventana.props._t;
    const d = ventana.props.dominio as string | undefined;
    if (d) {
      const p = nuevaPestana(d);
      setPestanas((ps) => [...ps, p]);
      setActivaId(p.id);
    }
  }, [ventana.props]);

  const actualizar = (id: number, f: (p: Pestana) => Pestana) => setPestanas((ps) => ps.map((p) => (p.id === id ? f(p) : p)));

  const ir = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    const web = buscarWeb(limpio);
    const destino = limpio === PORTAL ? PORTAL : web ? web.dominio : limpio.toLowerCase().replace(/^[a-z]+:\/\//, '');
    sonidos.click();
    actualizar(activa.id, (p) => ({ ...p, historial: [...p.historial.slice(0, p.pos + 1), destino], pos: p.pos + 1, cargando: !!web }));
  };

  const cerrarPestana = (id: number) => {
    sonidos.click();
    if (pestanas.length === 1) return ventana.cerrar();
    const i = pestanas.findIndex((p) => p.id === id);
    const resto = pestanas.filter((p) => p.id !== id);
    setPestanas(resto);
    if (id === activaId) setActivaId(resto[Math.max(0, i - 1)].id);
  };

  const abrirPestana = () => {
    const p = nuevaPestana();
    setPestanas((ps) => [...ps, p]);
    setActivaId(p.id);
  };

  const webDe = (dir: string) => (dir === PORTAL ? undefined : buscarWeb(dir));
  const tituloPestana = (p: Pestana) => {
    const d = p.historial[p.pos];
    if (d === PORTAL) return t('navegador.portal');
    const w = webDe(d);
    return w ? tx(w.titulo, w.dominio) : d;
  };

  useEffect(() => {
    ventana.setTitulo(`${tituloPestana(activa)} — AeroNet`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa.pos, activa.historial, activaId, tx]);

  const webActual = webDe(direccionActual);

  return (
    <div className="navegador">
      <div className="nav-pestanas">
        {pestanas.map((p) => {
          const w = webDe(p.historial[p.pos]);
          return (
            <div key={p.id} className={`nav-pestana${p.id === activaId ? ' activa' : ''}`} onClick={() => setActivaId(p.id)}>
              {p.cargando ? (
                <span className="girando nav-girando" />
              ) : w?.icono ? (
                <img src={url(w.icono)} alt="" width={16} height={16} />
              ) : (
                <Icono nombre="web" tam={16} />
              )}
              <span className="nav-pestana-texto">{tituloPestana(p)}</span>
              <button
                className="nav-pestana-cerrar"
                title={t('navegador.cerrarPestana')}
                onClick={(e) => {
                  e.stopPropagation();
                  cerrarPestana(p.id);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
        <button className="nav-nueva" title={t('navegador.nuevaPestana')} onClick={abrirPestana}>
          +
        </button>
      </div>

      <form
        className="nav-herramientas"
        onSubmit={(e) => {
          e.preventDefault();
          ir(barra);
        }}
      >
        <div className="exp-nav">
          <button type="button" className="exp-flecha" disabled={activa.pos === 0} title="←" onClick={() => actualizar(activa.id, (p) => ({ ...p, pos: p.pos - 1, cargando: !!webDe(p.historial[p.pos - 1]) }))}>
            <svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button type="button" className="exp-flecha" disabled={activa.pos >= activa.historial.length - 1} title="→" onClick={() => actualizar(activa.id, (p) => ({ ...p, pos: p.pos + 1, cargando: !!webDe(p.historial[p.pos + 1]) }))}>
            <svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" /></svg>
          </button>
        </div>
        <button type="button" className="boton-icono" title={t('navegador.recargar')} onClick={() => actualizar(activa.id, (p) => ({ ...p, recarga: p.recarga + 1, cargando: !!webActual }))}>
          <svg viewBox="0 0 16 16" width="16" height="16"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" stroke="#2a6fb0" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
        <button type="button" className="boton-icono" title={t('navegador.inicio')} onClick={() => ir(PORTAL)}>
          <svg viewBox="0 0 16 16" width="16" height="16"><path d="M2.5 8L8 3l5.5 5M4.5 7v6h7V7" stroke="#2a6fb0" strokeWidth="1.8" fill="none" strokeLinejoin="round" /></svg>
        </button>
        <div className="nav-direccion">
          {webActual && <span className="nav-candado" title="AeroNet">🔒</span>}
          <input className="campo" value={barra} placeholder={t('navegador.direccion')} onChange={(e) => setBarra(e.target.value)} onFocus={(e) => e.target.select()} />
          <button type="submit" className="nav-ir">{t('navegador.ir')}</button>
        </div>
      </form>

      <div className="nav-pagina">
        {activa.cargando && <div className="nav-progreso" />}
        {pestanas.map((p) => {
          const d = p.historial[p.pos];
          const w = webDe(d);
          return (
            <div key={p.id} className="nav-vista" hidden={p.id !== activaId}>
              {d === PORTAL ? (
                <Portal onAbrir={(web) => ir(web.dominio)} />
              ) : w ? (
                <iframe
                  key={`${w.dominio}-${p.recarga}`}
                  className={p.cargando ? 'cargando' : ''}
                  src={url(w.url)}
                  title={tx(w.titulo, w.dominio)}
                  sandbox="allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock"
                  onLoad={() => setTimeout(() => actualizar(p.id, (x) => ({ ...x, cargando: false })), 600)}
                />
              ) : (
                <Pagina404 direccion={d} onVolver={() => ir(PORTAL)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Portal({ onAbrir }: { onAbrir: (w: NodoWeb) => void }) {
  const { t, tx } = useT();
  const [filtro, setFiltro] = useState('');
  const q = filtro.toLowerCase();
  const lista = webs.filter((w) => !q || w.dominio.includes(q) || tx(w.titulo).toLowerCase().includes(q) || tx(w.descripcion).toLowerCase().includes(q));
  return (
    <div className="portal">
      <div className="portal-cabecera">
        <Icono nombre="navegador" tam={64} />
        <div>
          <h1>{t('navegador.portalTitulo')}</h1>
          <p>{t('navegador.portalSub')}</p>
        </div>
      </div>
      <input className="campo portal-buscar" placeholder={t('navegador.filtrar')} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      {webs.length === 0 && <p className="portal-vacio">{t('navegador.ninguna')}</p>}
      <div className="portal-webs">
        {lista.map((w, i) => (
          <button key={w.dominio} className="portal-web" style={{ animationDelay: `${i * 60}ms` }} onClick={() => onAbrir(w)}>
            <span className="portal-web-icono">{w.icono ? <img src={url(w.icono)} alt="" /> : <Icono nombre="web" tam={44} />}</span>
            <span className="portal-web-texto">
              <b>{tx(w.titulo, w.dominio)}</b>
              <small>{w.dominio}</small>
              {w.descripcion && <span>{tx(w.descripcion)}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Pagina404({ direccion, onVolver }: { direccion: string; onVolver: () => void }) {
  const { t } = useT();
  const pareceUrl = /\.[a-z]{2,}/i.test(direccion);
  return (
    <div className="nav-404">
      <div className="nav-404-zorro">🦊❓</div>
      <h2>{t('navegador.404titulo')}</h2>
      <p>{t('navegador.404texto', { url: direccion })}</p>
      <div className="nav-404-botones">
        <button className="boton primario" onClick={onVolver}>{t('navegador.404volver')}</button>
        {pareceUrl && (
          <a className="boton" href={`https://${direccion}`} target="_blank" rel="noreferrer noopener">
            {t('navegador.404real')} ↗
          </a>
        )}
      </div>
    </div>
  );
}
