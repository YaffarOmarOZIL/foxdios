import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { buscarNodo, formatoPeso, hijosVisibles, raiz, url } from '../../contenido';
import type { Nodo, NodoCarpeta } from '../../contenido/tipos';
import { useT } from '../../i18n';
import { abrirNodo } from '../../sistema/acciones';
import { Icono, iconoDeNodo } from '../../sistema/iconos/Icono';
import { sonidos } from '../../sistema/sonido';
import { useVentana } from '../../sistema/ventanas/contexto';
import './explorador.css';

export default function Explorador() {
  const { t, tx } = useT();
  const ventana = useVentana();
  const rutaInicial = String(ventana.props.ruta ?? '');
  const [historial, setHistorial] = useState<string[]>([rutaInicial]);
  const [pos, setPos] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const ruta = historial[pos];
  const nodo = buscarNodo(ruta);
  const carpeta = nodo?.tipo === 'carpeta' ? nodo : null;
  const [vista, setVista] = useState<'iconos' | 'lista'>(carpeta?.config.vista ?? 'iconos');

  // Si otra parte de la web pide abrir otra carpeta en esta ventana
  useEffect(() => {
    if (rutaInicial !== historial[pos]) navegar(rutaInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutaInicial, ventana.props._t]);

  const nombreCarpeta = (c: NodoCarpeta) => (c.ruta ? tx(c.config.nombre, c.nombre) : t('explorador.equipo'));
  const nombreNodo = (n: Nodo) => {
    if (n.tipo === 'carpeta') return nombreCarpeta(n);
    if (n.tipo === 'enlace' || n.tipo === 'web') return tx(n.titulo, n.nombre);
    return n.nombre;
  };

  useEffect(() => {
    ventana.setTitulo(carpeta ? nombreCarpeta(carpeta) : t('explorador.equipo'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta, tx]);

  function navegar(nueva: string) {
    sonidos.click();
    setHistorial((h) => [...h.slice(0, pos + 1), nueva]);
    setPos((p) => p + 1);
    setSeleccion(null);
    setFiltro('');
    const c = buscarNodo(nueva);
    if (c?.tipo === 'carpeta' && c.config.vista) setVista(c.config.vista);
  }

  const abrir = (n: Nodo) => (n.tipo === 'carpeta' ? navegar(n.ruta) : abrirNodo(n));

  const elementos = useMemo(() => {
    if (!carpeta) return [];
    const lista = hijosVisibles(carpeta).filter((h) => h.tipo !== 'enlace' || h.mostrar.includes('explorador'));
    const q = filtro.trim().toLowerCase();
    return q ? lista.filter((h) => nombreNodo(h).toLowerCase().includes(q)) : lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carpeta, filtro, tx]);

  const migas = useMemo(() => {
    const partes = ruta ? ruta.split('/') : [];
    return [{ ruta: '', nombre: t('explorador.equipo') }, ...partes.map((_, i) => {
      const r = partes.slice(0, i + 1).join('/');
      const n = buscarNodo(r);
      return { ruta: r, nombre: n?.tipo === 'carpeta' ? nombreCarpeta(n) : partes[i] };
    })];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta, tx]);

  const seleccionado = seleccion ? buscarNodo(seleccion) : null;
  const padre = ruta.includes('/') ? ruta.slice(0, ruta.lastIndexOf('/')) : '';

  const teclado = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'Backspace' && pos > 0) setPos(pos - 1);
    if (e.key === 'Enter' && seleccionado) abrir(seleccionado);
    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key) && elementos.length) {
      const i = elementos.findIndex((x) => x.ruta === seleccion);
      const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      setSeleccion(elementos[Math.max(0, Math.min(elementos.length - 1, i + paso))].ruta);
    }
  };

  return (
    <div className="explorador" tabIndex={0} onKeyDown={teclado}>
      <div className="exp-barra">
        <div className="exp-nav">
          <button className="exp-flecha" disabled={pos === 0} title={t('explorador.atras')} onClick={() => (sonidos.click(), setPos(pos - 1), setSeleccion(null))}>
            <svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button className="exp-flecha" disabled={pos >= historial.length - 1} title={t('explorador.adelante')} onClick={() => (sonidos.click(), setPos(pos + 1), setSeleccion(null))}>
            <svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" /></svg>
          </button>
        </div>
        <button className="boton-icono" disabled={!ruta} title={t('explorador.arriba')} onClick={() => navegar(padre)}>
          <svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 13V4M4 7.5L8 3.5l4 4" stroke="#2a6fb0" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
        <div className="exp-direccion">
          <Icono nombre={carpeta ? iconoDeNodo(carpeta) : 'equipo'} tam={18} />
          {migas.map((m, i) => (
            <span key={m.ruta} className="exp-miga">
              {i > 0 && <span className="exp-sep">›</span>}
              <button onClick={() => m.ruta !== ruta && navegar(m.ruta)}>{m.nombre}</button>
            </span>
          ))}
        </div>
        <div className="exp-buscar">
          <input className="campo" placeholder={t('explorador.buscar')} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
      </div>

      <div className="exp-herramientas">
        <button className={vista === 'iconos' ? 'activo' : ''} onClick={() => setVista('iconos')}>▦ {t('explorador.vistaIconos')}</button>
        <button className={vista === 'lista' ? 'activo' : ''} onClick={() => setVista('lista')}>☰ {t('explorador.vistaLista')}</button>
      </div>

      <div className="exp-principal">
        <nav className="exp-lateral">
          <div className="exp-lateral-titulo">{t('explorador.carpetas')}</div>
          <button className={ruta === '' ? 'activo' : ''} onClick={() => navegar('')}>
            <Icono nombre="equipo" tam={18} /> {t('explorador.equipo')}
          </button>
          {hijosVisibles(raiz)
            .filter((h): h is NodoCarpeta => h.tipo === 'carpeta')
            .map((c) => (
              <button key={c.ruta} className={ruta === c.ruta || ruta.startsWith(c.ruta + '/') ? 'activo' : ''} onClick={() => navegar(c.ruta)}>
                <Icono nombre={iconoDeNodo(c)} tam={18} /> {nombreCarpeta(c)}
              </button>
            ))}
        </nav>

        <div className="exp-contenido" onPointerDown={(e) => e.target === e.currentTarget && setSeleccion(null)}>
          {!carpeta ? (
            <div className="exp-vacio">{t('explorador.noEncontrada')}</div>
          ) : elementos.length === 0 ? (
            <div className="exp-vacio">{filtro ? t('explorador.sinResultados') : t('explorador.vacia')}</div>
          ) : vista === 'iconos' ? (
            <div className="exp-iconos" key={ruta}>
              {elementos.map((n, i) => (
                <button
                  key={n.ruta}
                  className={`exp-item${seleccion === n.ruta ? ' seleccionado' : ''}`}
                  style={{ animationDelay: `${Math.min(i, 30) * 18}ms` }}
                  onPointerDown={(e) => {
                    setSeleccion(n.ruta);
                    if (e.pointerType === 'touch') abrir(n);
                  }}
                  onDoubleClick={() => abrir(n)}
                  title={nombreNodo(n)}
                >
                  <Miniatura n={n} />
                  <span className="exp-item-nombre">{nombreNodo(n)}</span>
                </button>
              ))}
            </div>
          ) : (
            <table className="exp-lista" key={ruta}>
              <thead>
                <tr>
                  <th>{t('explorador.nombre')}</th>
                  <th>{t('explorador.tipo')}</th>
                  <th>{t('explorador.tamano')}</th>
                </tr>
              </thead>
              <tbody>
                {elementos.map((n) => (
                  <tr
                    key={n.ruta}
                    className={seleccion === n.ruta ? 'seleccionado' : ''}
                    onPointerDown={(e) => {
                      setSeleccion(n.ruta);
                      if (e.pointerType === 'touch') abrir(n);
                    }}
                    onDoubleClick={() => abrir(n)}
                  >
                    <td>
                      <Icono nombre={iconoDeNodo(n)} tam={18} /> {nombreNodo(n)}
                    </td>
                    <td>{t(`tipo.${n.tipo}` as 'tipo.carpeta')}</td>
                    <td>{'peso' in n ? formatoPeso(n.peso) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="exp-detalles">
        {seleccionado ? (
          <>
            <Miniatura n={seleccionado} chica />
            <div className="exp-det-texto">
              <b>{nombreNodo(seleccionado)}</b>
              <span>{t(`tipo.${seleccionado.tipo}` as 'tipo.carpeta')}</span>
              {seleccionado.tipo === 'imagen' && (
                <span>
                  {t('explorador.dimensiones')}: {seleccionado.ancho} × {seleccionado.alto}
                </span>
              )}
              {'peso' in seleccionado && (
                <span>
                  {t('explorador.tamano')}: {formatoPeso(seleccionado.peso)}
                </span>
              )}
              {seleccionado.tipo === 'documento' && seleccionado.fecha && (
                <span>
                  {t('explorador.fecha')}: {seleccionado.fecha}
                </span>
              )}
              {seleccionado.tipo === 'enlace' && <span>{seleccionado.url}</span>}
              {seleccionado.tipo === 'web' && <span>{seleccionado.dominio}</span>}
            </div>
          </>
        ) : (
          <>
            <Icono nombre={carpeta ? iconoDeNodo(carpeta) : 'equipo'} tam={40} />
            <div className="exp-det-texto">
              <b>{carpeta ? nombreCarpeta(carpeta) : ''}</b>
              <span>{elementos.length === 1 ? t('explorador.elemento') : t('explorador.elementos', { n: elementos.length })}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Icono o vista previa de un elemento. Las carpetas con fotos muestran miniaturas asomándose, como en Vista. */
function Miniatura({ n, chica = false }: { n: Nodo; chica?: boolean }) {
  const tam = chica ? 40 : 64;
  if (n.tipo === 'imagen') {
    return (
      <span className="exp-mini" style={{ width: chica ? 48 : 96, height: chica ? 40 : 72 }}>
        <img src={url(n.miniatura)} alt="" loading="lazy" decoding="async" style={{ maxWidth: chica ? 48 : 96, maxHeight: chica ? 40 : 72 }} />
      </span>
    );
  }
  if ((n.tipo === 'enlace' || n.tipo === 'web') && n.icono) {
    return (
      <span className="exp-mini sin-marco" style={{ width: chica ? 48 : 96, height: chica ? 40 : 72 }}>
        <img src={url(n.icono)} alt="" style={{ width: tam, height: tam, objectFit: 'contain' }} />
      </span>
    );
  }
  if (n.tipo === 'carpeta' && !chica) {
    const fotos = n.hijos.filter((h) => h.tipo === 'imagen').slice(0, 2);
    if (fotos.length) {
      return (
        <span className="exp-carpeta-fotos">
          <Icono nombre="carpeta" tam={tam + 8} />
          {fotos.map((f, i) => f.tipo === 'imagen' && <img key={f.ruta} src={url(f.miniatura)} alt="" className={`asoma asoma-${i}`} loading="lazy" />)}
          <span className="frente-carpeta" />
        </span>
      );
    }
  }
  return (
    <span className="exp-mini sin-marco" style={{ width: chica ? 48 : 96, height: chica ? 40 : 72 }}>
      <Icono nombre={iconoDeNodo(n)} tam={tam} />
    </span>
  );
}
