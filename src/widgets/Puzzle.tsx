/** Rompecabezas deslizante 3x3 con imágenes al azar de las carpetas marcadas con "puzzle": true. */
import { useCallback, useEffect, useState } from 'react';
import { decirAsistente } from '../asistente/Asistente';
import { imagenesPuzzle, url } from '../contenido';
import { traducir, useT } from '../i18n';
import { sonidos } from '../sistema/sonido';

const N = 3;
const TAM = 150;
const PIEZA = TAM / N;
const resuelto = () => Array.from({ length: N * N }, (_, i) => i); // el último (8) es el hueco

function vecinos(h: number) {
  const f = Math.floor(h / N);
  const c = h % N;
  return [f > 0 && h - N, f < N - 1 && h + N, c > 0 && h - 1, c < N - 1 && h + 1].filter((x): x is number => x !== false);
}

/** Mezcla con movimientos válidos para que siempre tenga solución. */
function mezclar() {
  const p = resuelto();
  let hueco = N * N - 1;
  let previo = -1;
  for (let i = 0; i < 80; i++) {
    const opciones = vecinos(hueco).filter((v) => v !== previo);
    const v = opciones[Math.floor(Math.random() * opciones.length)];
    [p[hueco], p[v]] = [p[v], p[hueco]];
    previo = hueco;
    hueco = v;
  }
  return p;
}

export function Puzzle() {
  const { t } = useT();
  const [img, setImg] = useState(() => Math.floor(Math.random() * Math.max(1, imagenesPuzzle.length)));
  const [piezas, setPiezas] = useState(mezclar);
  const [ganado, setGanado] = useState(false);
  const foto = imagenesPuzzle[img];

  const nueva = useCallback(() => {
    sonidos.click();
    if (imagenesPuzzle.length > 1) {
      let n = img;
      while (n === img) n = Math.floor(Math.random() * imagenesPuzzle.length);
      setImg(n);
    }
    setPiezas(mezclar());
    setGanado(false);
  }, [img]);

  useEffect(() => {
    if (ganado) {
      sonidos.logro();
      decirAsistente({ en: traducir('en', 'asistente.puzzle'), es: traducir('es', 'asistente.puzzle') });
    }
  }, [ganado]);

  if (!foto) return <div className="w-puzzle-vacio">{t('widgets.sinImagenes')}</div>;

  // Recorte cuadrado centrado ("cover") de la imagen
  const ratio = foto.ancho / Math.max(1, foto.alto);
  const bgW = ratio >= 1 ? TAM * ratio : TAM;
  const bgH = ratio >= 1 ? TAM : TAM / ratio;
  const offX = (bgW - TAM) / 2;
  const offY = (bgH - TAM) / 2;
  const hueco = piezas.indexOf(N * N - 1);

  const mover = (pos: number) => {
    if (ganado || !vecinos(hueco).includes(pos)) return;
    sonidos.pieza();
    const p = [...piezas];
    [p[hueco], p[pos]] = [p[pos], p[hueco]];
    setPiezas(p);
    if (p.every((v, i) => v === i)) setGanado(true);
  };

  return (
    <div className="w-puzzle">
      <div className="w-puzzle-tablero" style={{ width: TAM, height: TAM }}>
        {piezas.map((pieza, pos) => {
          if (pieza === N * N - 1 && !ganado) return null;
          const fOrig = Math.floor(pieza / N);
          const cOrig = pieza % N;
          return (
            <button
              key={pieza}
              className="w-pieza"
              onClick={() => mover(pos)}
              style={{
                width: PIEZA,
                height: PIEZA,
                transform: `translate(${(pos % N) * PIEZA}px, ${Math.floor(pos / N) * PIEZA}px)`,
                backgroundImage: `url("${url(foto.miniatura)}")`,
                backgroundSize: `${bgW}px ${bgH}px`,
                backgroundPosition: `${-(cOrig * PIEZA + offX)}px ${-(fOrig * PIEZA + offY)}px`,
              }}
            />
          );
        })}
        {ganado && <div className="w-puzzle-ganado">{t('widgets.resuelto')}</div>}
      </div>
      <div className="w-puzzle-botones">
        <button onClick={() => (sonidos.click(), setPiezas(mezclar()), setGanado(false))}>{t('widgets.mezclar')}</button>
        <button onClick={nueva}>{t('widgets.otraImagen')}</button>
      </div>
    </div>
  );
}
