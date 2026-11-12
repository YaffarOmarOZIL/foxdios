/**
 * Ventana de bienvenida: quién soy + guía de qué se puede hacer en la web.
 * El texto vive en contenido/Bienvenida/bienvenida.md (inglés) y bienvenida.es.md (español).
 */
import { buscarNodo, datosAsistente, url } from '../../contenido';
import { useT } from '../../i18n';
import { usePrefs } from '../../sistema/preferencias';
import { Markdown, separarFrontmatter, useDocumento } from '../lector/Markdown';
import './bienvenida.css';

export default function Bienvenida() {
  const { t, idioma } = useT();
  const alInicio = usePrefs((s) => s.bienvenidaAlInicio);
  const doc = buscarNodo('Bienvenida/bienvenida.md');
  const urlDoc = doc?.tipo === 'documento' ? doc.urls[idioma] ?? doc.urls.base : undefined;
  const { texto } = useDocumento(urlDoc);
  const { datos, cuerpo } = texto ? separarFrontmatter(texto) : { datos: {} as Record<string, string>, cuerpo: '' };
  const cv = datos.cv ? buscarNodo(datos.cv) : undefined;
  const retrato = datosAsistente.expresiones.abiertosCerrada;

  return (
    <div className="bienvenida">
      <header className="bv-cabecera">
        <div className="bv-burbujas" />
        {retrato && <img className="bv-retrato" src={url(retrato)} alt="Foxdi" />}
        <div className="bv-titulos">
          <h1>{datos.nombre || 'Foxdi'}</h1>
          {datos.subtitulo && <p>{datos.subtitulo}</p>}
          {cv && 'url' in cv && (
            <a className="boton verde" href={url(cv.url)} download>
              ⬇ {t('bienvenida.descargarCV')}
            </a>
          )}
        </div>
      </header>
      <div className="bv-cuerpo">
        {texto === undefined ? <div className="girando" style={{ margin: '40px auto' }} /> : <Markdown texto={cuerpo} base={doc?.ruta} />}
      </div>
      <footer className="bv-pie">
        <label>
          <input type="checkbox" checked={alInicio} onChange={(e) => usePrefs.getState().cambiar('bienvenidaAlInicio', e.target.checked)} />
          {t('bienvenida.mostrarInicio')}
        </label>
      </footer>
    </div>
  );
}
