import { useEffect, useState } from 'react';
import { buscarNodo, url } from '../../contenido';
import { useT } from '../../i18n';
import { Icono } from '../../sistema/iconos/Icono';
import { useVentana } from '../../sistema/ventanas/contexto';
import { Markdown, separarFrontmatter, useDocumento } from './Markdown';
import './lector.css';

/** Lector de documentos: Markdown (.md), texto (.txt) y PDF. */
export default function Lector() {
  const { t, tx, idioma } = useT();
  const ventana = useVentana();
  const nodo = buscarNodo(String(ventana.props.ruta ?? ''));
  const variantes = nodo?.tipo === 'documento' ? (['en', 'es'] as const).filter((i) => nodo.urls[i]) : [];
  const [idiomaDoc, setIdiomaDoc] = useState<'en' | 'es' | null>(null);
  const elegido = idiomaDoc ?? idioma;
  const urlDoc = nodo?.tipo === 'documento' ? nodo.urls[elegido] ?? nodo.urls.base : undefined;
  const { texto, error } = useDocumento(urlDoc);

  useEffect(() => {
    if (!nodo) return;
    ventana.setTitulo(nodo.tipo === 'documento' ? tx(nodo.titulo, nodo.nombre) : nodo.nombre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodo?.ruta, tx]);

  if (!nodo || (nodo.tipo !== 'documento' && nodo.tipo !== 'pdf')) return <div className="lector-error">{t('lector.error')}</div>;

  if (nodo.tipo === 'pdf') {
    return (
      <div className="lector">
        <div className="lector-barra">
          <Icono nombre="pdf" tam={18} /> <span>{nodo.nombre}</span>
          <a className="boton" href={url(nodo.url)} download>{t('lector.descargar')}</a>
        </div>
        <iframe className="lector-pdf" src={url(nodo.url)} title={nodo.nombre} />
      </div>
    );
  }

  const { cuerpo } = texto ? separarFrontmatter(texto) : { cuerpo: '' };
  return (
    <div className="lector">
      <div className="lector-barra">
        <Icono nombre={nodo.formato === 'txt' ? 'texto' : 'documento'} tam={18} />
        <span>{nodo.nombre}</span>
        {variantes.length > 1 && (
          <div className="lector-idiomas">
            {t('lector.idioma')}:
            {variantes.map((i) => (
              <button key={i} className={elegido === i ? 'activo' : ''} onClick={() => setIdiomaDoc(i)}>
                {i === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`lector-hoja-fondo${nodo.formato === 'txt' ? ' txt' : ''}`}>
        {error ? (
          <div className="lector-error">{t('lector.error')}</div>
        ) : texto === undefined ? (
          <div className="ventana-cargando"><div className="girando" /></div>
        ) : nodo.formato === 'txt' ? (
          <pre className="lector-txt">{texto}</pre>
        ) : (
          <article className="lector-hoja" key={urlDoc}>
            <Markdown texto={cuerpo} base={nodo.ruta} />
          </article>
        )}
      </div>
    </div>
  );
}
