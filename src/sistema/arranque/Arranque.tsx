import { useEffect } from 'react';
import avatar from '../../assets/sistema/avatar-zorro.jpg';
import { nuevaSesionAsistente } from '../../asistente/Asistente';
import { useT } from '../../i18n';
import { useSistema } from '../estado';
import { useMusica } from '../musica';
import { usePrefs } from '../preferencias';
import { desbloquearAudio, sonidos } from '../sonido';
import './arranque.css';

export function LogoFoxdiOS({ tam = 96 }: { tam?: number }) {
  return (
    <svg className="logo-foxdios" viewBox="0 0 100 100" width={tam} height={tam} aria-hidden="true">
      <defs>
        <radialGradient id="lg-orbe" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#e4ffdc" />
          <stop offset=".4" stopColor="#5fd04a" />
          <stop offset="1" stopColor="#0d5a14" />
        </radialGradient>
        <linearGradient id="lg-brillo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lg-zorro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd7a0" />
          <stop offset="1" stopColor="#ff8a1e" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#lg-orbe)" />
      <path d="M22 26l14 16h28l14-16 2 30-10 16-20 10-20-10-10-16z" fill="url(#lg-zorro)" stroke="#8a3f05" strokeWidth="1.5" />
      <path d="M30 56l20 22 20-22-8-4H38z" fill="#fff6ea" />
      <circle cx="39" cy="50" r="3.4" fill="#3a2410" />
      <circle cx="61" cy="50" r="3.4" fill="#3a2410" />
      <path d="M47 63h6l-3 4z" fill="#2b1a0b" />
      <ellipse cx="48" cy="26" rx="32" ry="16" fill="url(#lg-brillo)" opacity=".75" />
    </svg>
  );
}

/** Pantalla de arranque: logo y barra de progreso estilo XP. */
export function Arranque() {
  const { t } = useT();
  const setFase = useSistema((s) => s.setFase);
  useEffect(() => {
    const id = setTimeout(() => setFase('login'), 3200);
    return () => clearTimeout(id);
  }, [setFase]);
  return (
    <div className="arranque" onClick={() => setFase('login')}>
      <div className="arranque-centro">
        <LogoFoxdiOS tam={110} />
        <div className="arranque-nombre">
          Foxdi<b>OS</b>
        </div>
        <div className="arranque-barra">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="arranque-pie">{t('arranque.saltar')}</div>
    </div>
  );
}

/** Pantalla de inicio de sesión: el clic aquí activa el sonido y la música. */
export function InicioSesion() {
  const { t, idioma } = useT();
  const fase = useSistema((s) => s.fase);
  const entrar = () => {
    if (fase !== 'login') return;
    desbloquearAudio();
    sonidos.inicio();
    nuevaSesionAsistente();
    useSistema.getState().setFase('entrando');
    if (usePrefs.getState().musicaActiva) setTimeout(() => useMusica.getState().reproducir(), 1500);
    setTimeout(() => useSistema.getState().setFase('escritorio'), 1700);
  };
  return (
    <div className={`login fondo-aurora${fase === 'entrando' ? ' entrando' : ''}`}>
      <div className="login-brillo" />
      <div className="login-centro">
        <button className="login-avatar" onClick={entrar} aria-label={t('login.clic')}>
          <img src={avatar} alt="" />
        </button>
        <div className="login-nombre">{t('login.usuario')}</div>
        {fase === 'entrando' ? (
          <div className="login-entrando">
            <div className="girando" />
            {t('login.bienvenido')}
          </div>
        ) : (
          <button className="login-boton" onClick={entrar} autoFocus>
            <span>{t('login.clic')}</span>
            <span className="login-flecha">
              <svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h9M8 3.5L12.5 8 8 12.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
        )}
        <div className="login-nota">{t('login.sonido')}</div>
      </div>
      <div className="login-pie">
        <button
          className="login-idioma"
          onClick={() => usePrefs.getState().cambiar('idioma', idioma === 'en' ? 'es' : 'en')}
        >
          🌐 {idioma === 'en' ? 'English' : 'Español'}
        </button>
        <div className="login-marca">
          <LogoFoxdiOS tam={26} /> <span className="login-marca-nombre">Foxdi<b>OS</b></span> <span>{t('sistema.edicion')}</span>
        </div>
      </div>
    </div>
  );
}

/** Apagado: mensaje clásico y clic para reiniciar. */
export function Apagado() {
  const { t } = useT();
  const fase = useSistema((s) => s.fase);
  useEffect(() => {
    if (fase !== 'apagando') return;
    useMusica.getState().pausar();
    const id = setTimeout(() => useSistema.getState().setFase('apagado'), 2200);
    return () => clearTimeout(id);
  }, [fase]);
  return (
    <div className={`apagado${fase === 'apagado' ? ' listo' : ''}`} onClick={() => fase === 'apagado' && useSistema.getState().setFase('arranque')}>
      {fase === 'apagando' ? (
        <div className="login-entrando">
          <div className="girando" />
          {t('apagado.apagando')}
        </div>
      ) : (
        <>
          <p>{t('apagado.texto')}</p>
          <small>{t('apagado.reiniciar')}</small>
        </>
      )}
    </div>
  );
}
