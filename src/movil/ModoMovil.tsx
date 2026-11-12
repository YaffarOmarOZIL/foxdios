/**
 * Modo celular: se descarga solo cuando alguien toca "Modo celular" en el escritorio.
 * Usa las mismas apps, pero cada una ocupa toda la pantalla.
 */
import { Suspense, useEffect, useMemo, useState } from 'react';
import { APPS } from '../apps/registro';
import { datosAsistente, url } from '../contenido';
import { useT } from '../i18n';
import { elementosEscritorio } from '../sistema/escritorio/elementos';
import { useSistema, ventanaActiva } from '../sistema/estado';
import { Icono } from '../sistema/iconos/Icono';
import { usePrefs } from '../sistema/preferencias';
import { sonidos } from '../sistema/sonido';
import { VentanaCtx } from '../sistema/ventanas/contexto';
import './movil.css';

export default function ModoMovil() {
  const { t, tx, idioma } = useT();
  const ventanas = useSistema((s) => s.ventanas);
  const [menu, setMenu] = useState(false);
  const [hora, setHora] = useState(new Date());
  const elementos = useMemo(() => elementosEscritorio().filter((e) => e.id !== 'movil'), []);
  const activa = ventanaActiva(ventanas);

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const titulo = (e: (typeof elementos)[number]) => (typeof e.titulo === 'string' ? t(e.titulo) : tx(e.titulo.texto));
  const salir = () => {
    sonidos.click();
    setMenu(false);
    usePrefs.getState().cambiar('modo', 'escritorio');
  };

  return (
    <div className={`movil${activa ? ' app-abierta' : ''}`}>
      <header className="movil-barra">
        <button className={`movil-hamburguesa${menu ? ' abierta' : ''}`} aria-label="Menu" onClick={() => (sonidos.menu(), setMenu(!menu))}>
          <span />
          <span />
          <span />
        </button>
        <div className="movil-titulo">
          {activa ? (activa.titulo || t(APPS[activa.app].titulo)) : (
            <>
              Foxdi<b>OS</b>
            </>
          )}
        </div>
        <div className="movil-hora">{hora.toLocaleTimeString(idioma === 'es' ? 'es' : 'en-US', { hour: 'numeric', minute: '2-digit' })}</div>
      </header>

      {/* Inicio: tarjeta de bienvenida + iconos */}
      <main className="movil-inicio">
        <section className="movil-hola">
          {datosAsistente.expresiones.abiertosCerrada && <img src={url(datosAsistente.expresiones.abiertosCerrada)} alt="" />}
          <div>
            <h1>{t('movil.hola')}</h1>
            <p>{t('movil.subtitulo')}</p>
          </div>
        </section>
        <div className="movil-iconos">
          {elementos.map((e, i) => (
            <button key={e.id} className="movil-icono" style={{ animationDelay: `${i * 40}ms` }} onClick={() => (sonidos.click(), e.abrir())}>
              <span className="movil-icono-img">{e.imagen ? <img src={url(e.imagen)} alt="" /> : <Icono nombre={e.icono} tam={46} />}</span>
              <span>{titulo(e)}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Apps abiertas: cada una a pantalla completa (se muestra la de más arriba) */}
      {ventanas.map((v) => {
        const C = APPS[v.app].componente;
        const visible = v.id === activa?.id;
        return (
          <section key={v.id} className={`movil-app${visible ? ' visible' : ''}${v.cerrando ? ' cerrando' : ''}`} aria-hidden={!visible}>
            <div className="movil-app-barra">
              <button onClick={() => useSistema.getState().cerrar(v.id)} aria-label={t('movil.atras')}>
                ‹ {t('movil.atras')}
              </button>
            </div>
            <div className="movil-app-cuerpo">
              <VentanaCtx.Provider
                value={{
                  id: v.id,
                  props: v.props,
                  activa: visible,
                  movil: true,
                  setTitulo: (x) => useSistema.getState().setTitulo(v.id, x),
                  setProps: (p) => useSistema.getState().setProps(v.id, p),
                  cerrar: () => useSistema.getState().cerrar(v.id),
                }}
              >
                <Suspense fallback={<div className="ventana-cargando"><div className="girando" /></div>}>
                  <C />
                </Suspense>
              </VentanaCtx.Provider>
            </div>
          </section>
        );
      })}

      {/* Menú hamburguesa */}
      <div className={`movil-velo${menu ? ' visible' : ''}`} onClick={() => setMenu(false)} />
      <nav className={`movil-menu${menu ? ' abierto' : ''}`}>
        <button
          className="movil-menu-item"
          style={{ ['--i' as string]: 0 }}
          onClick={() => {
            setMenu(false);
            useSistema.getState().ventanas.forEach((v) => useSistema.getState().minimizar(v.id));
          }}
        >
          <Icono nombre="bienvenida" tam={28} /> {t('movil.inicio')}
        </button>
        {elementos.slice(0, 7).map((e, i) => (
          <button key={e.id} className="movil-menu-item" style={{ ['--i' as string]: i + 1 }} onClick={() => (setMenu(false), sonidos.click(), e.abrir())}>
            {e.imagen ? <img src={url(e.imagen)} alt="" width={28} height={28} /> : <Icono nombre={e.icono} tam={28} />} {titulo(e)}
          </button>
        ))}
        {ventanas.length > 0 && (
          <>
            <div className="movil-menu-seccion">{t('movil.ventanasAbiertas')}</div>
            {ventanas.map((v) => (
              <div key={v.id} className="movil-menu-abierta">
                <button onClick={() => (setMenu(false), useSistema.getState().enfocar(v.id))}>
                  <Icono nombre={APPS[v.app].icono} tam={20} /> {v.titulo || t(APPS[v.app].titulo)}
                </button>
                <button className="movil-menu-cerrar" onClick={() => useSistema.getState().cerrar(v.id)}>×</button>
              </div>
            ))}
          </>
        )}
        <div className="movil-menu-pie">
          <button className="boton" onClick={() => usePrefs.getState().cambiar('idioma', idioma === 'en' ? 'es' : 'en')}>
            🌐 {idioma === 'en' ? 'Español' : 'English'}
          </button>
          <button className="boton primario" onClick={salir}>
            🖥️ {t('movil.volverEscritorio')}
          </button>
        </div>
      </nav>
    </div>
  );
}
