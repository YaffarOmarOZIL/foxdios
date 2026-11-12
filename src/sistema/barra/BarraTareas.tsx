import { useEffect, useState } from 'react';
import { APPS } from '../../apps/registro';
import { useT } from '../../i18n';
import { useSistema, ventanaActiva } from '../estado';
import { Icono } from '../iconos/Icono';
import { useMusica } from '../musica';
import { usePrefs } from '../preferencias';
import { sonidos } from '../sonido';
import { MenuInicio } from './MenuInicio';
import './barra.css';

export function BarraTareas() {
  const { t, idioma } = useT();
  const ventanas = useSistema((s) => s.ventanas);
  const menuInicio = useSistema((s) => s.menuInicio);
  const activa = ventanaActiva(ventanas);
  const { enfocar, minimizar, setMenuInicio, mostrarEscritorio, setFlip, abrir } = useSistema.getState();

  return (
    <>
      {menuInicio && <MenuInicio />}
      <div className="barra-tareas" onContextMenu={(e) => e.preventDefault()}>
        <button
          className={`orbe-inicio${menuInicio ? ' abierto' : ''}`}
          title={t('barra.inicio')}
          aria-label={t('barra.inicio')}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setMenuInicio(!menuInicio)}
        >
          <span className="orbe-logo">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <path d="M6 7l6 7h8l6-7 1 11-4 7-7 4-7-4-4-7z" fill="#fff" opacity=".95" />
              <path d="M10 18l6 7 6-7-3-1h-6z" fill="#ffd9b0" />
            </svg>
          </span>
        </button>

        <button className="boton-barra-rapido" title={t('barra.flip')} onClick={() => setFlip(true, 0)}>
          <Icono nombre="flip" tam={22} />
        </button>

        <div className="tareas">
          {ventanas
            .filter((v) => !v.cerrando)
            .map((v) => {
              const esActiva = v.id === activa?.id;
              return (
                <button
                  key={v.id}
                  className={`tarea${esActiva ? ' activa' : ''}${v.minimizada ? ' minimizada' : ''}`}
                  title={v.titulo || t(APPS[v.app].titulo)}
                  onClick={() => {
                    sonidos.click();
                    if (esActiva) minimizar(v.id);
                    else enfocar(v.id);
                  }}
                >
                  <Icono nombre={APPS[v.app].icono} tam={20} />
                  <span>{v.titulo || t(APPS[v.app].titulo)}</span>
                </button>
              );
            })}
        </div>

        <div className="bandeja">
          <button
            className="bandeja-idioma"
            title={t('barra.idioma')}
            onClick={() => {
              sonidos.click();
              usePrefs.getState().cambiar('idioma', idioma === 'en' ? 'es' : 'en');
            }}
          >
            {idioma.toUpperCase()}
          </button>
          <BotonAsistente />
          <BotonMusica onAbrir={() => abrir('musica')} />
          <BotonVolumen />
          <Reloj />
        </div>
        <button className="mostrar-escritorio" title={t('barra.mostrarEscritorio')} onClick={mostrarEscritorio} />
      </div>
    </>
  );
}

function BotonAsistente() {
  const { t } = useT();
  const visible = usePrefs((s) => s.asistente);
  if (visible) return null;
  return (
    <button className="bandeja-boton" title={t('barra.asistente')} onClick={() => usePrefs.getState().cambiar('asistente', true)}>
      <Icono nombre="asistente" tam={18} />
    </button>
  );
}

function BotonMusica({ onAbrir }: { onAbrir: () => void }) {
  const { t } = useT();
  const sonando = useMusica((s) => s.sonando);
  return (
    <button className={`bandeja-boton${sonando ? ' sonando' : ''}`} title={t('barra.musica')} onClick={onAbrir}>
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M6 12V3l7-1.5v8.5" stroke="#fff" strokeWidth="1.6" fill="none" />
        <circle cx="4.5" cy="12" r="2" fill="#fff" />
        <circle cx="11.5" cy="10" r="2" fill="#fff" />
      </svg>
    </button>
  );
}

function BotonVolumen() {
  const { t } = useT();
  const volumen = usePrefs((s) => s.volumen);
  const [abierto, setAbierto] = useState(false);
  const [previo, setPrevio] = useState(0.7);
  useEffect(() => {
    if (!abierto) return;
    const cerrar = () => setAbierto(false);
    window.addEventListener('pointerdown', cerrar);
    return () => window.removeEventListener('pointerdown', cerrar);
  }, [abierto]);
  return (
    <div className="bandeja-volumen" onPointerDown={(e) => e.stopPropagation()}>
      <button className="bandeja-boton" title={t('barra.volumen')} onClick={() => setAbierto(!abierto)}>
        <svg viewBox="0 0 16 16" width="16" height="16">
          <path d="M2 6h3l4-3v10L5 10H2z" fill="#fff" />
          {volumen > 0 && <path d="M11 5.5a3.5 3.5 0 0 1 0 5" stroke="#fff" strokeWidth="1.4" fill="none" />}
          {volumen > 0.5 && <path d="M12.8 3.5a6 6 0 0 1 0 9" stroke="#fff" strokeWidth="1.4" fill="none" />}
          {volumen === 0 && <path d="M11 6l4 4m0-4l-4 4" stroke="#ff8a7a" strokeWidth="1.6" />}
        </svg>
      </button>
      {abierto && (
        <div className="popup-volumen">
          <input
            type="range"
            className="deslizador vertical"
            min={0}
            max={1}
            step={0.01}
            value={volumen}
            style={{ ['--p' as string]: `${volumen * 100}%` }}
            onChange={(e) => usePrefs.getState().cambiar('volumen', +e.target.value)}
            onPointerUp={() => sonidos.click()}
          />
          <span>{Math.round(volumen * 100)}</span>
          <button
            className="boton"
            onClick={() => {
              if (volumen > 0) {
                setPrevio(volumen);
                usePrefs.getState().cambiar('volumen', 0);
              } else usePrefs.getState().cambiar('volumen', previo || 0.7);
            }}
          >
            {t('barra.silenciar')}
          </button>
        </div>
      )}
    </div>
  );
}

function Reloj() {
  const { idioma } = useT();
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setAhora(new Date()), 10_000);
    return () => clearInterval(i);
  }, []);
  const loc = idioma === 'es' ? 'es' : 'en-US';
  return (
    <div className="bandeja-reloj" title={ahora.toLocaleDateString(loc, { dateStyle: 'full' })}>
      <span>{ahora.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })}</span>
      <span>{ahora.toLocaleDateString(loc, { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
    </div>
  );
}
