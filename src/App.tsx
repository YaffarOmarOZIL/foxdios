import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Asistente } from './asistente/Asistente';
import { Apagado, Arranque, InicioSesion, LogoFoxdiOS } from './sistema/arranque/Arranque';
import { BarraTareas } from './sistema/barra/BarraTareas';
import { Escritorio } from './sistema/escritorio/Escritorio';
import { useSistema } from './sistema/estado';
import { Fondo } from './sistema/fondo/Fondo';
import { usePrefs } from './sistema/preferencias';
import { CapaVentanas } from './sistema/ventanas/CapaVentanas';
import { BarraWidgets } from './widgets/BarraWidgets';
import './App.css';

const sesion = { bienvenidaAbierta: false };

// El modo celular solo se descarga si alguien lo activa.
const ModoMovil = lazy(() => import('./movil/ModoMovil'));

export default function App() {
  const modo = usePrefs((s) => s.modo);
  const animaciones = usePrefs((s) => s.animaciones);
  const idioma = usePrefs((s) => s.idioma);
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  return (
    <div className={animaciones ? '' : 'sin-animaciones'} style={{ height: '100%' }}>
      <Monitor>
        <Sistema movil={modo === 'movil'} />
      </Monitor>
    </div>
  );
}

function Sistema({ movil }: { movil: boolean }) {
  const fase = useSistema((s) => s.fase);
  const escritorioListo = fase === 'escritorio' || fase === 'entrando';

  // La bienvenida se abre una vez por sesión (no al cambiar de formato de pantalla).
  useEffect(() => {
    if (fase === 'login') sesion.bienvenidaAbierta = false;
    if (fase !== 'escritorio' || sesion.bienvenidaAbierta) return;
    sesion.bienvenidaAbierta = true;
    // En celulares no se abre sola, para que lo primero que se vea sea el icono "Modo celular".
    const angosta = window.innerWidth < 700 || usePrefs.getState().modo === 'movil';
    if (usePrefs.getState().bienvenidaAlInicio && !angosta) setTimeout(() => useSistema.getState().abrir('bienvenida'), 450);
  }, [fase]);

  return (
    <>
      {fase !== 'arranque' && fase !== 'apagado' && <Fondo />}
      {escritorioListo &&
        (movil ? (
          <Suspense fallback={<div className="cargando-movil"><LogoFoxdiOS tam={64} /></div>}>
            <ModoMovil />
          </Suspense>
        ) : (
          <>
            <Escritorio />
            <BarraWidgets />
            <CapaVentanas />
            <BarraTareas />
          </>
        ))}
      {fase === 'escritorio' && <Asistente movil={movil} />}
      {fase === 'arranque' && <Arranque />}
      {(fase === 'login' || fase === 'entrando') && <InicioSesion />}
      {(fase === 'apagando' || fase === 'apagado') && <Apagado />}
    </>
  );
}

/**
 * Marco de monitor: en "completa" la pantalla ocupa todo; en 16:9 o 4:3 se dibuja un monitor de la época
 * alrededor y la pantalla mantiene esa proporción.
 */
function Monitor({ children }: { children: ReactNode }) {
  const aspecto = usePrefs((s) => s.aspecto);
  const modo = usePrefs((s) => s.modo);
  const ref = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState<{ w: number; h: number } | null>(null);
  const [estrecha, setEstrecha] = useState(() => window.innerWidth < 700);
  useEffect(() => {
    const f = () => setEstrecha(window.innerWidth < 700);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  // En pantallas angostas (celulares) nunca se dibuja el monitor.
  const conMarco = aspecto !== 'completa' && modo !== 'movil' && !estrecha;

  useLayoutEffect(() => {
    const calcular = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!conMarco) {
        setTam({ w: vw, h: vh });
        return;
      }
      const ratio = aspecto === '16:9' ? 16 / 9 : 4 / 3;
      const bordeX = aspecto === '4:3' ? 76 : 44;
      const bordeY = aspecto === '4:3' ? 120 : 110; // marco + base
      let w = Math.min(vw - bordeX - 24, ((vh - bordeY - 24) * ratio) | 0);
      w = Math.max(320, w);
      setTam({ w: Math.round(w), h: Math.round(w / ratio) });
    };
    calcular();
    window.addEventListener('resize', calcular);
    return () => window.removeEventListener('resize', calcular);
  }, [aspecto, conMarco]);

  useLayoutEffect(() => {
    if (tam) useSistema.getState().setPantalla(tam.w, tam.h);
  }, [tam]);

  const pantalla = (
    <div className="pantalla" ref={ref} style={tam ? { width: tam.w, height: tam.h } : undefined}>
      {children}
    </div>
  );
  if (!conMarco) return pantalla;
  return (
    <div className={`habitacion monitor-${aspecto === '4:3' ? 'crt' : 'lcd'}`}>
      <div className="monitor">
        <div className="monitor-marco">
          {pantalla}
          {aspecto === '4:3' && <div className="crt-lineas" />}
        </div>
        <div className="monitor-pie">
          <span className="monitor-marca">
            Foxdi<b>OS</b>
          </span>
          <span className="monitor-led" />
        </div>
      </div>
      <div className="monitor-base" />
    </div>
  );
}
