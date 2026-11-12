/**
 * Foxdi, el asistente. Siempre está encima de todo (abajo a la derecha).
 * - Clic: dice una frase de "alHacerClick" con voz estilo Animal Crossing.
 * - Sin actividad durante N segundos (foxdios.config.json): dice una frase de "inactividad".
 * - Las frases están en contenido/Asistente/frases.json y las expresiones en contenido/Asistente/*.png.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { configSistema, datosAsistente, url } from '../contenido';
import type { Frase } from '../contenido/tipos';
import { textoDe, useT } from '../i18n';
import { useSistema } from '../sistema/estado';
import { usePrefs } from '../sistema/preferencias';
import { sonidos } from '../sistema/sonido';
import './asistente.css';

/** Otras partes de la web pueden hacer hablar a Foxdi: decirAsistente({ en: '...', es: '...' }) */
export function decirAsistente(frase: Frase) {
  window.dispatchEvent(new CustomEvent('foxdi:decir', { detail: frase }));
}

const { frases, expresiones } = datosAsistente;
const saludo = { hecho: false };
/** Se llama al iniciar sesión para que Foxdi vuelva a saludar. */
export const nuevaSesionAsistente = () => void (saludo.hecho = false);
const RESPALDO: Frase = { en: 'Hi! I am Foxdi!', es: '¡Hola! ¡Soy Foxdi!' };

function aleatoria(lista: Frase[], evitar?: Frase) {
  if (!lista.length) return RESPALDO;
  if (lista.length === 1) return lista[0];
  let f = lista[Math.floor(Math.random() * lista.length)];
  while (f === evitar) f = lista[Math.floor(Math.random() * lista.length)];
  return f;
}

export function Asistente({ movil }: { movil: boolean }) {
  const { t, idioma } = useT();
  const visible = usePrefs((s) => s.asistente);
  const { w: anchoPantalla, h: altoPantalla } = useSistema((s) => s.pantalla);
  // Tamaño proporcional a la pantalla (más chico en monitores 4:3, pantallas bajas o celulares).
  const tam = movil || anchoPantalla < 700 ? 130 : Math.round(Math.min(230, Math.max(130, altoPantalla * 0.28)));
  const [texto, setTexto] = useState('');
  const [mostrado, setMostrado] = useState(0);
  const [hablando, setHablando] = useState(false);
  const [burbuja, setBurbuja] = useState(false);
  const [ojosCerrados, setOjosCerrados] = useState(false);
  const [bocaAbierta, setBocaAbierta] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const ultima = useRef<Frase>();
  const ultimaActividad = useRef(Date.now());
  const ultimaInactividad = useRef(0);
  const temporizadores = useRef<number[]>([]);

  const limpiar = () => {
    temporizadores.current.forEach((x) => clearTimeout(x));
    temporizadores.current = [];
  };

  const decir = useCallback(
    (frase: Frase) => {
      limpiar();
      ultima.current = frase;
      const s = textoDe(idioma, frase as { en: string; es?: string });
      setTexto(s);
      setMostrado(0);
      setBurbuja(true);
      setHablando(true);
      // Máquina de escribir: una letra cada 38 ms, con un "blip" cada dos letras.
      const letras = [...s];
      letras.forEach((letra, i) => {
        temporizadores.current.push(
          window.setTimeout(() => {
            setMostrado(i + 1);
            if (i % 2 === 0) sonidos.blip(letra);
            setBocaAbierta(/[\p{L}\p{N}]/u.test(letra) ? i % 4 < 2 : false);
          }, i * 38),
        );
      });
      const fin = letras.length * 38;
      temporizadores.current.push(
        window.setTimeout(() => {
          setHablando(false);
          setBocaAbierta(false);
        }, fin + 40),
        window.setTimeout(() => setBurbuja(false), fin + 4500 + s.length * 25),
      );
    },
    [idioma],
  );

  // Saludo al llegar al escritorio (una vez por sesión, o al volver a mostrarlo).
  useEffect(() => {
    if (!visible || saludo.hecho) return;
    const id = setTimeout(() => {
      saludo.hecho = true;
      decir(aleatoria(frases.bienvenida));
    }, 2200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Frases cuando no hay actividad.
  useEffect(() => {
    if (!visible) return;
    const actividad = () => (ultimaActividad.current = Date.now());
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    eventos.forEach((e) => window.addEventListener(e, actividad, { passive: true }));
    const espera = configSistema.asistente.segundosInactividad * 1000;
    const id = setInterval(() => {
      if (!usePrefs.getState().frasesInactividad || document.hidden) return;
      const ahora = Date.now();
      if (ahora - ultimaActividad.current >= espera && ahora - ultimaInactividad.current >= espera) {
        ultimaInactividad.current = ahora;
        decir(aleatoria(frases.inactividad, ultima.current));
      }
    }, 3000);
    return () => {
      clearInterval(id);
      eventos.forEach((e) => window.removeEventListener(e, actividad));
    };
  }, [visible, decir]);

  // Mensajes de otras partes de la web.
  useEffect(() => {
    const oir = (e: Event) => decir((e as CustomEvent<Frase>).detail);
    window.addEventListener('foxdi:decir', oir);
    return () => window.removeEventListener('foxdi:decir', oir);
  }, [decir]);

  // Parpadeo natural.
  useEffect(() => {
    let id: number;
    const parpadear = () => {
      setOjosCerrados(true);
      window.setTimeout(() => setOjosCerrados(false), 140);
      id = window.setTimeout(parpadear, 2200 + Math.random() * 4200);
    };
    id = window.setTimeout(parpadear, 2500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => limpiar, []);

  // Funciones estables para que el personaje no se re-dibuje con cada letra (solo la burbuja).
  const accionClic = useRef<() => void>(() => {});
  const accionOcultar = useRef<() => void>(() => {});
  const alClicEstable = useCallback(() => accionClic.current(), []);
  const ocultarEstable = useCallback(() => accionOcultar.current(), []);

  if (!visible) return null;

  const imagen =
    (ojosCerrados
      ? bocaAbierta ? expresiones.cerradosAbierta : expresiones.cerradosCerrada
      : bocaAbierta ? expresiones.abiertosAbierta : expresiones.abiertosCerrada) ?? expresiones.abiertosCerrada;

  const alClic = () => {
    if (hablando) {
      // Si está hablando, el clic completa la frase.
      limpiar();
      setMostrado(texto.length);
      setHablando(false);
      setBocaAbierta(false);
      temporizadores.current.push(window.setTimeout(() => setBurbuja(false), 4000));
      return;
    }
    decir(aleatoria(frases.alHacerClick, ultima.current));
  };

  accionClic.current = alClic;
  accionOcultar.current = () => {
    sonidos.cerrar();
    setSaliendo(true);
    setTimeout(() => {
      setSaliendo(false);
      usePrefs.getState().cambiar('asistente', false);
    }, 300);
  };

  return (
    <div className={`asistente${movil ? ' en-movil' : ''}${saliendo ? ' saliendo' : ''}`} style={{ width: tam, height: tam }}>
      {burbuja && (
        <div className="asistente-burbuja" onClick={alClic} role="status" aria-live="polite">
          <span className="asistente-nombre">Foxdi</span>
          <p>
            {[...texto].slice(0, mostrado).join('')}
            <span className="asistente-resto">{[...texto].slice(mostrado).join('')}</span>
          </p>
        </div>
      )}
      <CuerpoFoxdi imagen={imagen} hablando={hablando} alClic={alClicEstable} ocultar={ocultarEstable} textoCerrar={t('asistente.cerrar')} />
    </div>
  );
}

/** El personaje. Con memo solo se re-dibuja cuando cambia la expresión o empieza/termina de hablar. */
const CuerpoFoxdi = memo(function CuerpoFoxdi({ imagen, hablando, alClic, ocultar, textoCerrar }: { imagen?: string; hablando: boolean; alClic: () => void; ocultar: () => void; textoCerrar: string }) {
  return (
    <div className={`asistente-cuerpo${hablando ? ' hablando' : ''}`}>
      {imagen ? <img src={url(imagen)} alt="Foxdi" draggable={false} decoding="async" /> : <div className="asistente-placeholder">🦊</div>}
      <button className="asistente-zona" onClick={alClic} aria-label="Foxdi" />
      <button className="asistente-cerrar" onClick={ocultar} title={textoCerrar} aria-label={textoCerrar}>
        ×
      </button>
    </div>
  );
});

// Pre-carga las 4 expresiones para que no parpadeen la primera vez que cambian.
if (typeof Image !== 'undefined') for (const e of new Set(Object.values(expresiones))) if (e) new Image().src = url(e);
