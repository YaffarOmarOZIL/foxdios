import { useEffect, useRef } from 'react';
import { url } from '../../contenido';
import { usePrefs } from '../preferencias';
import { useFondoCubierto, useLiviano } from '../rendimiento';
import './fondo.css';

/** Fondos integrados (hechos con CSS, no pesan nada). Agrega más en fondo.css con la clase .fondo-<id>. */
export const FONDOS = [
  { id: 'cielo', nombre: { en: 'Sky Meadow', es: 'Prado celeste' } },
  { id: 'aurora', nombre: { en: 'Aurora', es: 'Aurora' } },
  { id: 'aqua', nombre: { en: 'Aqua', es: 'Aqua' } },
  { id: 'atardecer', nombre: { en: 'Sunset', es: 'Atardecer' } },
  { id: 'bosque', nombre: { en: 'Eco Forest', es: 'Bosque eco' } },
];

export function Fondo() {
  const fondo = usePrefs((s) => s.fondo);
  const burbujas = usePrefs((s) => s.burbujas);
  const esImagen = !FONDOS.some((f) => f.id === fondo);
  const cubierto = useFondoCubierto();
  const liviano = useLiviano();
  return (
    <div className={`fondo ${esImagen ? '' : `fondo-${fondo}`}`} style={esImagen ? { backgroundImage: `url("${url(fondo)}")` } : undefined}>
      {!esImagen && <div className={`fondo-brillos${cubierto ? ' pausado' : ''}`} />}
      {burbujas && <Burbujas pausado={cubierto} liviano={liviano} />}
    </div>
  );
}

/** Burbujas brillantes que suben lentamente (canvas, muy liviano). */
function Burbujas({ pausado, liviano }: { pausado: boolean; liviano: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Se guarda en una ref para pausar/reanudar sin reiniciar la animación (las burbujas siguen donde estaban).
  const estado = useRef({ pausado, liviano });
  estado.current = { pausado, liviano };
  useEffect(() => {
    const canvas = ref.current!;
    const c = canvas.getContext('2d')!;
    // Burbujas suaves: no necesitan resolución doble (4 veces menos píxeles en celulares).
    const dpr = Math.min(window.devicePixelRatio || 1, estado.current.liviano ? 1 : 1.5);
    // Pre-dibujamos una burbuja y luego solo la copiamos (mucho más rápido).
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const s = sprite.getContext('2d')!;
    const g = s.createRadialGradient(64, 64, 20, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,0.02)');
    g.addColorStop(0.75, 'rgba(200,240,255,0.12)');
    g.addColorStop(0.93, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    s.fillStyle = g;
    s.beginPath();
    s.arc(64, 64, 62, 0, Math.PI * 2);
    s.fill();
    const h = s.createRadialGradient(44, 38, 2, 44, 38, 26);
    h.addColorStop(0, 'rgba(255,255,255,0.95)');
    h.addColorStop(1, 'rgba(255,255,255,0)');
    s.fillStyle = h;
    s.beginPath();
    s.ellipse(46, 40, 24, 14, -0.6, 0, Math.PI * 2);
    s.fill();
    s.fillStyle = 'rgba(255,255,255,0.35)';
    s.beginPath();
    s.ellipse(86, 92, 10, 5, -0.6, 0, Math.PI * 2);
    s.fill();

    let w = 0;
    let alto = 0;
    const ajustar = () => {
      w = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = alto * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(canvas);

    const nueva = (inicio = false) => ({
      x: Math.random() * w,
      y: inicio ? Math.random() * alto : alto + 80,
      r: 8 + Math.random() * Math.random() * 46,
      v: 0.15 + Math.random() * 0.45,
      fase: Math.random() * Math.PI * 2,
      a: 0.35 + Math.random() * 0.55,
    });
    const lista = Array.from({ length: 22 }, () => nueva(true));
    let raf = 0;
    let previo = performance.now();
    let espera: ReturnType<typeof setTimeout> | undefined;
    const cuadro = (ahora: number) => {
      // Si una app tapa todo el fondo, las burbujas descansan (se revisa cada 300 ms, casi sin costo).
      if (estado.current.pausado) {
        espera = setTimeout(() => {
          previo = performance.now();
          raf = requestAnimationFrame(cuadro);
        }, 300);
        return;
      }
      // En celulares se dibuja a 30 cuadros por segundo: el movimiento es lento, se ve igual.
      if (estado.current.liviano && ahora - previo < 30) {
        raf = requestAnimationFrame(cuadro);
        return;
      }
      const dt = Math.min(50, ahora - previo) / 16.7;
      previo = ahora;
      c.clearRect(0, 0, w, alto);
      for (let i = 0; i < lista.length; i++) {
        const b = lista[i];
        b.y -= b.v * dt;
        b.fase += 0.012 * dt;
        const x = b.x + Math.sin(b.fase) * 18;
        if (b.y < -b.r * 2) lista[i] = nueva();
        c.globalAlpha = b.a;
        c.drawImage(sprite, x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    const visibilidad = () => {
      cancelAnimationFrame(raf);
      clearTimeout(espera);
      if (!document.hidden) {
        previo = performance.now();
        raf = requestAnimationFrame(cuadro);
      }
    };
    document.addEventListener('visibilitychange', visibilidad);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(espera);
      ro.disconnect();
      document.removeEventListener('visibilitychange', visibilidad);
    };
  }, []);
  return <canvas ref={ref} className="burbujas" />;
}
