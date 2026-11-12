import { useEffect, useState } from 'react';
import { todasLasImagenes, url } from '../contenido';
import { abrirNodo } from '../sistema/acciones';

/** Marco de fotos que va rotando todas las imágenes del portfolio. */
export function MarcoFotos() {
  const [i, setI] = useState(() => Math.floor(Math.random() * Math.max(1, todasLasImagenes.length)));
  useEffect(() => {
    if (todasLasImagenes.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % todasLasImagenes.length), 6000);
    return () => clearInterval(id);
  }, []);
  const foto = todasLasImagenes[i];
  if (!foto) return null;
  return (
    <button className="w-marco" onDoubleClick={() => abrirNodo(foto)} title={foto.nombre}>
      <img key={foto.ruta} src={url(foto.miniatura)} alt={foto.nombre} />
    </button>
  );
}
