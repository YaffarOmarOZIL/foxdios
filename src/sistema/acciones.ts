/** Qué pasa al abrir cada tipo de archivo. */
import { buscarNodo, canciones, padreDe } from '../contenido';
import type { Nodo } from '../contenido/tipos';
import { useSistema } from './estado';
import { useMusica } from './musica';
import { usePrefs } from './preferencias';

export function abrirNodo(n: Nodo) {
  const { abrir } = useSistema.getState();
  switch (n.tipo) {
    case 'carpeta':
      return abrir('explorador', { ruta: n.ruta });
    case 'imagen': {
      const hermanas = (padreDe(n.ruta)?.hijos ?? [n]).filter((h) => h.tipo === 'imagen').map((h) => h.ruta);
      return abrir('visor', { ruta: n.ruta, lista: hermanas });
    }
    case 'documento':
    case 'pdf':
      return abrir('lector', { ruta: n.ruta });
    case 'audio': {
      const i = canciones.findIndex((c) => c.ruta === n.ruta);
      if (i >= 0) useMusica.getState().reproducir(i);
      return abrir('musica');
    }
    case 'enlace':
      window.open(n.url, '_blank', 'noopener,noreferrer');
      return;
    case 'web':
      return abrir('navegador', { dominio: n.dominio });
  }
}

/** Abre enlaces internos del tipo "app:explorador?ruta=Fotos" (se usan en los documentos .md). */
export function abrirEnlaceApp(href: string) {
  const [app, consulta = ''] = href.replace(/^app:/, '').split('?');
  const props = Object.fromEntries(new URLSearchParams(consulta));
  const { abrir } = useSistema.getState();
  if (app === 'asistente') return usePrefs.getState().cambiar('asistente', true);
  if (app === 'carpeta' || app === 'archivo') {
    const n = buscarNodo(props.ruta ?? '');
    if (n) abrirNodo(n);
    return;
  }
  if (app in appsValidas) abrir(app as keyof typeof appsValidas, props);
}

const appsValidas = {
  bienvenida: 1, explorador: 1, visor: 1, lector: 1, navegador: 1, musica: 1, configuracion: 1, proximamente: 1,
} as const;
