import { marked } from 'marked';
import { useEffect, useState, type MouseEvent } from 'react';
import { url as resolverUrl } from '../../contenido';
import { abrirEnlaceApp } from '../../sistema/acciones';
import './markdown.css';

/** Separa el frontmatter (--- clave: valor ---) del texto. */
export function separarFrontmatter(texto: string) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(texto);
  const datos: Record<string, string> = {};
  if (!m) return { datos, cuerpo: texto };
  for (const linea of m[1].split(/\r?\n/)) {
    const i = linea.indexOf(':');
    if (i > 0) datos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { datos, cuerpo: texto.slice(m[0].length) };
}

const cache = new Map<string, string>();

/** Descarga un documento (con caché). */
export function useDocumento(u: string | undefined) {
  const [estado, setEstado] = useState<{ texto?: string; error?: boolean }>({});
  useEffect(() => {
    if (!u) return;
    const completo = resolverUrl(u);
    if (cache.has(completo)) return setEstado({ texto: cache.get(completo) });
    setEstado({});
    let vivo = true;
    fetch(completo)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => {
        cache.set(completo, t);
        if (vivo) setEstado({ texto: t });
      })
      .catch(() => vivo && setEstado({ error: true }));
    return () => {
      vivo = false;
    };
  }, [u]);
  return estado;
}

/**
 * Muestra Markdown. Las rutas relativas de imágenes se resuelven respecto al documento,
 * y los enlaces "app:..." abren apps de FoxdiOS (ej. [Ver mi arte](app:carpeta?ruta=Fotos/Arte)).
 */
export function Markdown({ texto, base, className = '' }: { texto: string; base?: string; className?: string }) {
  const carpetaBase = base ? base.slice(0, base.lastIndexOf('/') + 1) : '';
  const html = marked.parse(texto, { async: false, gfm: true, breaks: false }) as string;
  // Imágenes relativas: ![](foto.png) -> c/Carpeta/foto.png
  const conImagenes = html.replace(/<img src="(?!https?:|data:|\/)([^"]+)"/g, (_, src) => `<img loading="lazy" src="${resolverUrl(carpetaBase + src)}"`);

  const clic = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    e.preventDefault();
    if (href.startsWith('app:')) abrirEnlaceApp(href);
    else if (href.startsWith('#')) document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.open(href, '_blank', 'noopener,noreferrer');
  };

  return <div className={`markdown ${className}`} onClick={clic} dangerouslySetInnerHTML={{ __html: conImagenes }} />;
}
