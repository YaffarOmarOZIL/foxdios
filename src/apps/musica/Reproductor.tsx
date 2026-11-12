/** Reproductor Aero: lista las canciones de contenido/Musica y muestra un visualizador. */
import { useEffect, useRef } from 'react';
import { canciones } from '../../contenido';
import { useT } from '../../i18n';
import { obtenerAnalizador, useMusica } from '../../sistema/musica';
import { usePrefs } from '../../sistema/preferencias';
import './reproductor.css';

const formato = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

export default function Reproductor() {
  const { t } = useT();
  const m = useMusica();
  const volMusica = usePrefs((s) => s.volMusica);
  const actual = canciones[m.indice];

  return (
    <div className="reproductor">
      <div className="rep-pantalla">
        <Visualizador activo={m.sonando} />
        <div className="rep-info">
          <b>{actual?.titulo ?? '—'}</b>
          <span>{actual?.artista ?? t('musica.desconocido')}</span>
        </div>
      </div>

      <div className="rep-progreso">
        <span>{formato(m.tiempo)}</span>
        <input
          type="range"
          className="deslizador"
          min={0}
          max={m.duracion || 1}
          step={0.1}
          value={m.tiempo}
          style={{ ['--p' as string]: `${(m.tiempo / (m.duracion || 1)) * 100}%` }}
          onChange={(e) => m.buscar(+e.target.value)}
        />
        <span>{formato(m.duracion)}</span>
      </div>

      <div className="rep-controles">
        <button className={`rep-chico${m.aleatorio ? ' activo' : ''}`} title={t('musica.aleatorio')} onClick={() => m.setAleatorio(!m.aleatorio)}>
          ⤮
        </button>
        <button className="rep-mediano" title={t('musica.anterior')} onClick={m.anterior}>
          <svg viewBox="0 0 16 16"><path d="M3 3h2v10H3zM14 3v10L6 8z" /></svg>
        </button>
        <button className="rep-play" title={m.sonando ? t('musica.pausa') : t('musica.reproducir')} onClick={m.alternar} disabled={!canciones.length}>
          {m.sonando ? (
            <svg viewBox="0 0 16 16"><rect x="4" y="3" width="3" height="10" rx=".5" /><rect x="9" y="3" width="3" height="10" rx=".5" /></svg>
          ) : (
            <svg viewBox="0 0 16 16"><path d="M5 2.5l9 5.5-9 5.5z" /></svg>
          )}
        </button>
        <button className="rep-mediano" title={t('musica.siguiente')} onClick={m.siguiente}>
          <svg viewBox="0 0 16 16"><path d="M11 3h2v10h-2zM2 3v10l8-5z" /></svg>
        </button>
        <button className={`rep-chico${m.repetir ? ' activo' : ''}`} title={t('musica.repetir')} onClick={() => m.setRepetir(!m.repetir)}>
          ⟲
        </button>
      </div>

      <div className="rep-volumen">
        🔈
        <input
          type="range"
          className="deslizador"
          min={0}
          max={1}
          step={0.01}
          value={volMusica}
          style={{ ['--p' as string]: `${volMusica * 100}%` }}
          onChange={(e) => usePrefs.getState().cambiar('volMusica', +e.target.value)}
        />
        🔊
      </div>

      <div className="rep-lista">
        <div className="rep-lista-titulo">{t('musica.lista')}</div>
        {canciones.length === 0 && <p className="rep-vacia">{t('musica.vacia')}</p>}
        {canciones.map((c, i) => (
          <button key={c.ruta} className={`rep-cancion${i === m.indice ? ' actual' : ''}`} onDoubleClick={() => m.reproducir(i)} onPointerUp={(e) => e.pointerType === 'touch' && m.reproducir(i)}>
            <span className="rep-num">{i === m.indice && m.sonando ? '♪' : i + 1}</span>
            <span className="rep-cancion-texto">
              {c.titulo}
              <small>{c.artista ?? t('musica.desconocido')}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Barras que bailan con la música (usa el analizador de Web Audio). */
function Visualizador({ activo }: { activo: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const c = canvas.getContext('2d')!;
    let raf = 0;
    const datos = new Uint8Array(64);
    const dibujar = () => {
      const w = (canvas.width = canvas.clientWidth * 2);
      const h = (canvas.height = canvas.clientHeight * 2);
      c.clearRect(0, 0, w, h);
      const an = obtenerAnalizador();
      if (an && activo) an.getByteFrequencyData(datos);
      else for (let i = 0; i < datos.length; i++) datos[i] = Math.max(0, datos[i] * 0.9);
      const barras = 32;
      const ancho = w / barras;
      const grad = c.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, '#1f8fd6');
      grad.addColorStop(0.5, '#39c2f0');
      grad.addColorStop(1, '#b7ff8a');
      for (let i = 0; i < barras; i++) {
        const v = (datos[i + 2] ?? 0) / 255;
        const bh = Math.max(4, v * h * 0.9);
        c.fillStyle = grad;
        c.globalAlpha = 0.9;
        c.fillRect(i * ancho + 2, h - bh, ancho - 4, bh);
        c.globalAlpha = 0.25; // reflejo
        c.fillStyle = '#fff';
        c.fillRect(i * ancho + 2, h - bh, (ancho - 4) / 2, bh);
      }
      raf = requestAnimationFrame(dibujar);
    };
    raf = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(raf);
  }, [activo]);
  return <canvas ref={ref} className="rep-visualizador" />;
}
