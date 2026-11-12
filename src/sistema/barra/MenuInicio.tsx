import { useMemo, useState } from 'react';
import avatar from '../../assets/sistema/avatar-zorro.jpg';
import { raiz, todosLosNodos } from '../../contenido';
import type { Nodo } from '../../contenido/tipos';
import { useT } from '../../i18n';
import { abrirNodo } from '../acciones';
import { elementosEscritorio } from '../escritorio/elementos';
import { useSistema } from '../estado';
import { Icono, iconoDeNodo } from '../iconos/Icono';
import { sonidos } from '../sonido';

/** Busca la primera carpeta de nivel superior con un icono dado (para los accesos del menú). */
const carpetaCon = (icono: string, tipo?: string) =>
  raiz.hijos.find((h) => h.tipo === 'carpeta' && (h.config.icono === icono || (tipo && h.config.tipo === tipo)));

export function MenuInicio() {
  const { t, tx } = useT();
  const [busqueda, setBusqueda] = useState('');
  const { abrir, setMenuInicio, setFase, cerrarTodas } = useSistema.getState();
  const programas = useMemo(() => elementosEscritorio().filter((e) => e.id !== 'papelera'), []);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return todosLosNodos()
      .filter((n): n is Exclude<Nodo, never> => !!n.ruta && (n.nombre.toLowerCase().includes(q) || nombreDe(n).toLowerCase().includes(q)))
      .slice(0, 8);
    function nombreDe(n: Nodo) {
      if (n.tipo === 'carpeta') return tx(n.config.nombre, n.nombre);
      if (n.tipo === 'enlace' || n.tipo === 'web') return tx(n.titulo, n.nombre);
      if (n.tipo === 'documento') return tx(n.titulo, n.nombre);
      return n.nombre;
    }
  }, [busqueda, tx]);

  const accesos = [
    { clave: 'inicio.documentos' as const, nodo: carpetaCon('documentos') },
    { clave: 'inicio.fotos' as const, nodo: carpetaCon('fotos') },
    { clave: 'inicio.musica' as const, nodo: carpetaCon('musica', 'musica') },
  ];

  const salir = (fase: 'login' | 'apagando') => {
    setMenuInicio(false);
    if (fase === 'apagando') sonidos.apagar();
    setTimeout(() => {
      cerrarTodas();
      setFase(fase);
    }, 150);
  };

  return (
    <div className="menu-inicio" onPointerDown={(e) => e.stopPropagation()}>
      <div className="mi-izquierda">
        {busqueda ? (
          <div className="mi-lista">
            <div className="mi-seccion">{t('inicio.resultados')}</div>
            {resultados.length === 0 && <div className="mi-vacio">{t('inicio.sinResultados')}</div>}
            {resultados.map((n) => (
              <button key={n.ruta} className="mi-item" onClick={() => (abrirNodo(n), setMenuInicio(false))}>
                <Icono nombre={iconoDeNodo(n)} tam={28} />
                <span>
                  {n.tipo === 'carpeta' ? tx(n.config.nombre, n.nombre) : n.nombre}
                  <small>{n.ruta}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mi-lista">
            {programas.map((p, i) => (
              <button key={p.id} className="mi-item" style={{ animationDelay: `${i * 18}ms` }} onClick={() => (p.abrir(), setMenuInicio(false))}>
                <Icono nombre={p.icono} tam={30} />
                <span>{typeof p.titulo === 'string' ? t(p.titulo) : tx(p.titulo.texto)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mi-buscar">
          <input
            autoFocus
            className="campo"
            placeholder={t('inicio.buscar')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && resultados[0]) {
                abrirNodo(resultados[0]);
                setMenuInicio(false);
              }
              if (e.key === 'Escape') setMenuInicio(false);
            }}
          />
          <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="6.5" cy="6.5" r="4.5" stroke="#4a6a8a" strokeWidth="1.8" fill="none" /><path d="M10 10l4 4" stroke="#4a6a8a" strokeWidth="2" /></svg>
        </div>
      </div>
      <div className="mi-derecha">
        <div className="mi-avatar">
          <img src={avatar} alt="" />
        </div>
        <div className="mi-usuario">Foxdi</div>
        {accesos.map(
          (a) =>
            a.nodo && (
              <button key={a.clave} onClick={() => (abrirNodo(a.nodo!), setMenuInicio(false))}>
                {t(a.clave)}
              </button>
            ),
        )}
        <button onClick={() => abrir('explorador', { ruta: '' })}>{t('inicio.computadora')}</button>
        <hr />
        <button onClick={() => abrir('configuracion')}>{t('inicio.configuracion')}</button>
        <button onClick={() => abrir('bienvenida')}>{t('inicio.ayuda')}</button>
        <div className="mi-energia">
          <button className="mi-apagar" onClick={() => salir('apagando')} title={t('inicio.apagar')}>
            <svg viewBox="0 0 16 16" width="15" height="15"><path d="M8 1.5v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><path d="M4.5 4a5 5 0 1 0 7 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
            {t('inicio.apagar')}
          </button>
          <button className="mi-sesion" onClick={() => salir('login')} title={t('inicio.cerrarSesion')}>
            {t('inicio.cerrarSesion')}
          </button>
        </div>
      </div>
    </div>
  );
}
