import { useState, type ReactNode } from 'react';
import avatar from '../../assets/sistema/avatar-zorro.jpg';
import { imagenesFondo, url } from '../../contenido';
import { useT, type ClaveTexto } from '../../i18n';
import { FONDOS } from '../../sistema/fondo/Fondo';
import { Icono } from '../../sistema/iconos/Icono';
import { usePrefs } from '../../sistema/preferencias';
import { sonidos } from '../../sistema/sonido';
import { LogoFoxdiOS } from '../../sistema/arranque/Arranque';
import './configuracion.css';

type Seccion = 'personalizar' | 'pantalla' | 'sonido' | 'idioma' | 'asistente' | 'acerca';
const SECCIONES: { id: Seccion; icono: string; clave: ClaveTexto }[] = [
  { id: 'personalizar', icono: 'imagen', clave: 'config.personalizar' },
  { id: 'pantalla', icono: 'equipo', clave: 'config.pantalla' },
  { id: 'sonido', icono: 'musica', clave: 'config.sonido' },
  { id: 'idioma', icono: 'navegador', clave: 'config.idioma' },
  { id: 'asistente', icono: 'asistente', clave: 'config.asistente' },
  { id: 'acerca', icono: 'bienvenida', clave: 'config.acerca' },
];

export default function Configuracion() {
  const { t } = useT();
  const [seccion, setSeccion] = useState<Seccion>('personalizar');
  return (
    <div className="config">
      <nav className="config-menu">
        {SECCIONES.map((s) => (
          <button key={s.id} className={seccion === s.id ? 'activo' : ''} onClick={() => (sonidos.click(), setSeccion(s.id))}>
            <Icono nombre={s.icono} tam={22} /> <span>{t(s.clave)}</span>
          </button>
        ))}
      </nav>
      <div className="config-panel" key={seccion}>
        {seccion === 'personalizar' && <Personalizar />}
        {seccion === 'pantalla' && <Pantalla />}
        {seccion === 'sonido' && <Sonido />}
        {seccion === 'idioma' && <Idioma />}
        {seccion === 'asistente' && <AsistenteCfg />}
        {seccion === 'acerca' && <Acerca />}
      </div>
    </div>
  );
}

function Fila({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="config-fila">
      <span>{texto}</span>
      {children}
    </label>
  );
}

function Interruptor<K extends 'burbujas' | 'animaciones' | 'gadgets' | 'efectos' | 'asistente' | 'frasesInactividad' | 'musicaActiva'>({ clave }: { clave: K }) {
  const valor = usePrefs((s) => s[clave]);
  return <input type="checkbox" className="interruptor" checked={valor} onChange={(e) => (sonidos.click(), usePrefs.getState().cambiar(clave, e.target.checked))} />;
}

function Deslizador({ clave }: { clave: 'volumen' | 'volMusica' }) {
  const valor = usePrefs((s) => s[clave]);
  return (
    <input
      type="range"
      className="deslizador"
      min={0}
      max={1}
      step={0.01}
      value={valor}
      style={{ ['--p' as string]: `${valor * 100}%`, width: 200 }}
      onChange={(e) => usePrefs.getState().cambiar(clave, +e.target.value)}
      onPointerUp={() => sonidos.notificacion()}
    />
  );
}

function Personalizar() {
  const { t, tx } = useT();
  const fondo = usePrefs((s) => s.fondo);
  return (
    <>
      <h2>{t('config.fondo')}</h2>
      <div className="config-fondos">
        {FONDOS.map((f) => (
          <button key={f.id} className={`config-fondo${fondo === f.id ? ' activo' : ''}`} onClick={() => (sonidos.click(), usePrefs.getState().cambiar('fondo', f.id))}>
            <span className={`config-fondo-muestra fondo-${f.id}`} />
            {tx(f.nombre)}
          </button>
        ))}
      </div>
      {imagenesFondo.length > 0 && (
        <>
          <h3>{t('config.fondosContenido')}</h3>
          <div className="config-fondos">
            {imagenesFondo.map((img) => (
              <button key={img.ruta} className={`config-fondo${fondo === img.url ? ' activo' : ''}`} onClick={() => (sonidos.click(), usePrefs.getState().cambiar('fondo', img.url))}>
                <span className="config-fondo-muestra" style={{ backgroundImage: `url("${url(img.miniatura)}")` }} />
                {img.nombre}
              </button>
            ))}
          </div>
        </>
      )}
      <Fila texto={t('config.burbujas')}><Interruptor clave="burbujas" /></Fila>
      <Fila texto={t('config.animaciones')}><Interruptor clave="animaciones" /></Fila>
      <Fila texto={t('config.gadgets')}><Interruptor clave="gadgets" /></Fila>
    </>
  );
}

function Pantalla() {
  const { t } = useT();
  const aspecto = usePrefs((s) => s.aspecto);
  const opciones = [
    { id: 'completa' as const, clave: 'config.completa' as const, w: 64, h: 40 },
    { id: '16:9' as const, clave: 'config.panoramica' as const, w: 64, h: 36 },
    { id: '4:3' as const, clave: 'config.clasica' as const, w: 52, h: 39 },
  ];
  return (
    <>
      <h2>{t('config.formato')}</h2>
      <div className="config-formatos">
        {opciones.map((o) => (
          <button key={o.id} className={`config-formato${aspecto === o.id ? ' activo' : ''}`} onClick={() => (sonidos.maximizar(), usePrefs.getState().cambiar('aspecto', o.id))}>
            <span className={`config-monitor m-${o.id.replace(':', '')}`} style={{ width: o.w, height: o.h }} />
            {t(o.clave)}
          </button>
        ))}
      </div>
    </>
  );
}

function Sonido() {
  const { t } = useT();
  return (
    <>
      <h2>{t('config.sonido')}</h2>
      <Fila texto={t('config.volumen')}><Deslizador clave="volumen" /></Fila>
      <Fila texto={t('config.efectos')}><Interruptor clave="efectos" /></Fila>
      <Fila texto={t('config.volMusica')}><Deslizador clave="volMusica" /></Fila>
      <button className="boton" onClick={() => sonidos.inicio()}>🔊 {t('config.probar')}</button>
    </>
  );
}

function Idioma() {
  const { t, idioma } = useT();
  return (
    <>
      <h2>{t('config.idioma')}</h2>
      <p className="config-nota">{t('config.idiomaTexto')}</p>
      <div className="config-formatos">
        {(['en', 'es'] as const).map((i) => (
          <button key={i} className={`config-formato${idioma === i ? ' activo' : ''}`} onClick={() => (sonidos.click(), usePrefs.getState().cambiar('idioma', i))}>
            <span className="config-idioma">{i.toUpperCase()}</span>
            {i === 'en' ? 'English' : 'Español'}
          </button>
        ))}
      </div>
    </>
  );
}

function AsistenteCfg() {
  const { t } = useT();
  return (
    <>
      <h2>Foxdi</h2>
      <Fila texto={t('config.verAsistente')}><Interruptor clave="asistente" /></Fila>
      <Fila texto={t('config.frasesInactividad')}><Interruptor clave="frasesInactividad" /></Fila>
    </>
  );
}

function Acerca() {
  const { t } = useT();
  return (
    <div className="config-acerca">
      <LogoFoxdiOS tam={80} />
      <h2>
        Foxdi<b>OS</b> <small>{t('sistema.edicion')}</small>
      </h2>
      <p>{t('config.acercaTexto')}</p>
      <p>
        <b>{t('config.version')}:</b> 1.0.0
      </p>
      <h3>{t('config.creditos')}</h3>
      <p className="config-credito">
        <img src={avatar} alt="" width={36} height={36} />
        <span>
          Login avatar: “Vulpes vulpes ssp fulvus” — Wikimedia Commons, CC0 (public domain).
        </span>
      </p>
    </div>
  );
}
