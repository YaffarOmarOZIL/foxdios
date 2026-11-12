/** Reproductor de música global: sigue sonando aunque cierres la ventana del reproductor. */
import { create } from 'zustand';
import { canciones, url } from '../contenido';
import { contextoAudio, salidaMaestra } from './sonido';
import { usePrefs } from './preferencias';

const audio = typeof Audio !== 'undefined' ? new Audio() : (null as unknown as HTMLAudioElement);
let analizador: AnalyserNode | null = null;
let ganancia: GainNode | null = null;

interface EstadoMusica {
  indice: number;
  sonando: boolean;
  tiempo: number;
  duracion: number;
  aleatorio: boolean;
  repetir: boolean;
  reproducir: (indice?: number) => void;
  pausar: () => void;
  alternar: () => void;
  siguiente: () => void;
  anterior: () => void;
  buscar: (segundos: number) => void;
  setAleatorio: (v: boolean) => void;
  setRepetir: (v: boolean) => void;
}

function conectar() {
  const ctx = contextoAudio();
  const salida = salidaMaestra();
  if (!ctx || !salida || analizador) return;
  const fuente = ctx.createMediaElementSource(audio);
  ganancia = ctx.createGain();
  analizador = ctx.createAnalyser();
  analizador.fftSize = 128;
  analizador.smoothingTimeConstant = 0.8;
  fuente.connect(ganancia).connect(analizador).connect(salida);
  aplicarVolumen();
}

function aplicarVolumen() {
  const v = usePrefs.getState().volMusica;
  if (ganancia) ganancia.gain.value = v;
  else if (audio) audio.volume = v;
}
usePrefs.subscribe(aplicarVolumen);

export const obtenerAnalizador = () => analizador;

export const useMusica = create<EstadoMusica>((set, get) => ({
  indice: 0,
  sonando: false,
  tiempo: 0,
  duracion: 0,
  aleatorio: false,
  repetir: true,
  reproducir(indice) {
    if (!canciones.length) return;
    conectar();
    const i = indice ?? get().indice;
    if (indice !== undefined || !audio.src) {
      audio.src = url(canciones[i].url);
      set({ indice: i, tiempo: 0 });
    }
    audio.play().then(
      () => set({ sonando: true }),
      () => set({ sonando: false }),
    );
  },
  pausar() {
    audio.pause();
    set({ sonando: false });
  },
  alternar() {
    if (get().sonando) get().pausar();
    else get().reproducir();
  },
  siguiente() {
    if (!canciones.length) return;
    const { indice, aleatorio } = get();
    const n = canciones.length;
    const sig = aleatorio && n > 1 ? (indice + 1 + Math.floor(Math.random() * (n - 1))) % n : (indice + 1) % n;
    get().reproducir(sig);
  },
  anterior() {
    if (!canciones.length) return;
    if (audio.currentTime > 3) return get().buscar(0);
    get().reproducir((get().indice - 1 + canciones.length) % canciones.length);
  },
  buscar(s) {
    audio.currentTime = s;
    set({ tiempo: s });
  },
  setAleatorio: (aleatorio) => set({ aleatorio }),
  setRepetir: (repetir) => set({ repetir }),
}));

if (audio) {
  audio.preload = 'auto';
  audio.addEventListener('timeupdate', () => useMusica.setState({ tiempo: audio.currentTime }));
  audio.addEventListener('loadedmetadata', () => useMusica.setState({ duracion: audio.duration }));
  audio.addEventListener('ended', () => {
    const s = useMusica.getState();
    if (canciones.length === 1 && s.repetir) s.reproducir(0);
    else if (s.repetir || s.indice < canciones.length - 1) s.siguiente();
    else useMusica.setState({ sonando: false });
  });
}
