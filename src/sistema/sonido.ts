/**
 * Efectos de sonido de FoxdiOS, generados en vivo con Web Audio (no hay archivos de audio).
 * Así son 100% originales y no pesan nada.
 */
import { usePrefs } from './preferencias';

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null; // volumen general (efectos + música)
let efectos: GainNode | null = null; // solo efectos
let reverb: ConvolverNode | null = null;

export function contextoAudio() {
  return ctx;
}
export function salidaMaestra() {
  return maestro;
}

/** Los navegadores solo permiten sonido después de un clic. Se llama al iniciar sesión. */
export function desbloquearAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    maestro = ctx.createGain();
    efectos = ctx.createGain();
    efectos.connect(maestro);
    maestro.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulsoReverb(ctx, 1.8);
    const r = ctx.createGain();
    r.gain.value = 0.25;
    reverb.connect(r).connect(efectos);
    aplicarVolumen();
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function aplicarVolumen() {
  const p = usePrefs.getState();
  if (maestro && ctx) maestro.gain.setTargetAtTime(p.volumen, ctx.currentTime, 0.02);
  if (efectos && ctx) efectos.gain.setTargetAtTime(p.efectos ? 1 : 0, ctx.currentTime, 0.02);
}
usePrefs.subscribe(aplicarVolumen);

function impulsoReverb(c: AudioContext, segundos: number) {
  const largo = Math.floor(c.sampleRate * segundos);
  const buf = c.createBuffer(2, largo, c.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const d = buf.getChannelData(canal);
    for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3);
  }
  return buf;
}

const listo = () => !!ctx && !!efectos && ctx.state === 'running';

interface Nota {
  frec: number;
  inicio?: number; // segundos desde ahora
  dur?: number;
  vol?: number;
  forma?: OscillatorType;
  hasta?: number; // frecuencia final (glissando)
  ataque?: number;
  conReverb?: boolean;
  armonico?: boolean; // agrega un parcial brillante tipo campana
}

function nota({ frec, inicio = 0, dur = 0.2, vol = 0.2, forma = 'sine', hasta, ataque = 0.005, conReverb = true, armonico = false }: Nota) {
  if (!ctx || !efectos) return;
  const t = ctx.currentTime + inicio;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(efectos);
  if (conReverb && reverb) g.connect(reverb);
  const osc = (f: number, v: number) => {
    const o = ctx!.createOscillator();
    o.type = forma;
    o.frequency.setValueAtTime(f, t);
    if (hasta) o.frequency.exponentialRampToValueAtTime(hasta * (f / frec), t + dur);
    const gg = ctx!.createGain();
    gg.gain.value = v;
    o.connect(gg).connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  osc(frec, 1);
  if (armonico) osc(frec * 2.76, 0.25);
}

function ruido({ inicio = 0, dur = 0.25, vol = 0.12, desde = 800, hasta = 4000, q = 1.2 }) {
  if (!ctx || !efectos) return;
  const t = ctx.currentTime + inicio;
  const largo = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, largo, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(desde, t);
  f.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(efectos);
  src.start(t);
}

const N = (semitonos: number) => 440 * Math.pow(2, semitonos / 12); // 0 = La4

export const sonidos = {
  click() {
    if (!listo()) return;
    nota({ frec: 2200, hasta: 1500, dur: 0.045, vol: 0.06, forma: 'sine', conReverb: false });
  },
  abrir() {
    if (!listo()) return;
    nota({ frec: N(7), dur: 0.35, vol: 0.09, armonico: true });
    nota({ frec: N(14), inicio: 0.06, dur: 0.45, vol: 0.07, armonico: true });
    ruido({ dur: 0.22, vol: 0.03, desde: 1200, hasta: 6000 });
  },
  cerrar() {
    if (!listo()) return;
    nota({ frec: N(12), dur: 0.25, vol: 0.07, armonico: true });
    nota({ frec: N(5), inicio: 0.05, dur: 0.3, vol: 0.06, armonico: true });
  },
  minimizar() {
    if (!listo()) return;
    ruido({ dur: 0.28, vol: 0.06, desde: 5000, hasta: 700 });
  },
  maximizar() {
    if (!listo()) return;
    ruido({ dur: 0.25, vol: 0.05, desde: 700, hasta: 5000 });
  },
  error() {
    if (!listo()) return;
    nota({ frec: N(-5), dur: 0.25, vol: 0.12, forma: 'triangle' });
    nota({ frec: N(-9), inicio: 0.12, dur: 0.35, vol: 0.12, forma: 'triangle' });
  },
  notificacion() {
    if (!listo()) return;
    [N(12), N(16), N(19)].forEach((f, i) => nota({ frec: f, inicio: i * 0.08, dur: 0.6, vol: 0.06, armonico: true }));
  },
  menu() {
    if (!listo()) return;
    ruido({ dur: 0.15, vol: 0.04, desde: 2000, hasta: 7000, q: 2 });
    nota({ frec: N(19), dur: 0.2, vol: 0.03, armonico: true });
  },
  pieza() {
    if (!listo()) return;
    nota({ frec: 900, hasta: 600, dur: 0.06, vol: 0.08, forma: 'triangle', conReverb: false });
  },
  logro() {
    if (!listo()) return;
    [0, 4, 7, 12, 16].forEach((s, i) => nota({ frec: N(s + 3), inicio: i * 0.07, dur: 0.7, vol: 0.06, armonico: true }));
  },
  /** Sonido de inicio de sesión: un acorde brillante tipo Aero. */
  inicio() {
    if (!listo()) return;
    const acorde = [-21, -9, -5, -2, 2, 7]; // Do mayor 9
    acorde.forEach((s, i) => nota({ frec: N(s), inicio: i * 0.03, dur: 3.6, vol: 0.05, ataque: 0.5, forma: 'triangle' }));
    [3, 7, 10, 14, 19, 22].forEach((s, i) => nota({ frec: N(s), inicio: 0.4 + i * 0.13, dur: 1.6, vol: 0.045, armonico: true }));
    ruido({ inicio: 0.2, dur: 2.2, vol: 0.025, desde: 3000, hasta: 9000, q: 0.7 });
  },
  apagar() {
    if (!listo()) return;
    [14, 10, 7, 2, -2].forEach((s, i) => nota({ frec: N(s), inicio: i * 0.16, dur: 1.4, vol: 0.05, armonico: true }));
    [-21, -9, -2].forEach((s) => nota({ frec: N(s), inicio: 0.6, dur: 2.2, vol: 0.04, ataque: 0.3, forma: 'triangle' }));
  },
  /** "Voz" de Foxdi estilo Animal Crossing: un blip por letra con tono variable. */
  blip(letra: string) {
    if (!listo() || !/[\p{L}\p{N}]/u.test(letra)) return;
    const base = 520 + ((letra.toLowerCase().charCodeAt(0) * 37) % 260);
    const f = base * (0.92 + Math.random() * 0.16);
    nota({ frec: f, hasta: f * 1.12, dur: 0.07, vol: 0.06, forma: 'square', conReverb: false, ataque: 0.004 });
  },
};
