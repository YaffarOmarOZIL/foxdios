/**
 * Plugin de Vite que convierte la carpeta `contenido/` en el "disco duro" de FoxdiOS.
 *
 * - Recorre todas las carpetas y arma un árbol (el "manifiesto") que la web importa como `virtual:contenido`.
 * - Genera miniaturas livianas (.webp) de cada imagen, para que el explorador cargue rápido.
 * - En desarrollo (`npm run dev`) vigila la carpeta: agregas o borras un archivo y la web se recarga sola.
 * - Al compilar (`npm run build`) copia el contenido a dist/c y las miniaturas a dist/m.
 * - Si activas el almacenamiento externo (Cloudflare R2), también lee `contenido-externo/`.
 *
 * No necesitas tocar este archivo para agregar cosas: solo pon archivos en `contenido/`.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import type { Plugin, ViteDevServer } from 'vite';
import type {
  ConfigCarpeta,
  ConfigFoxdiOS,
  DatosAsistente,
  Frase,
  Manifiesto,
  Nodo,
  NodoCarpeta,
  Texto,
  TipoArchivo,
} from '../src/contenido/tipos';

const RAIZ = process.cwd();
const DIR_CONTENIDO = path.join(RAIZ, 'contenido');
const DIR_EXTERNO = path.join(RAIZ, 'contenido-externo');
const DIR_INDICE_EXTERNO = path.join(RAIZ, 'externo');
const DIR_MINIS_EXTERNO = path.join(DIR_INDICE_EXTERNO, 'miniaturas');
const DIR_CACHE = path.join(RAIZ, '.cache', 'miniaturas');
const ARCHIVO_CONFIG = path.join(RAIZ, 'foxdios.config.json');

const ID_VIRTUAL = 'virtual:contenido';
const ID_RESUELTO = '\0' + ID_VIRTUAL;

const EXT: Record<string, TipoArchivo> = {
  '.png': 'imagen', '.jpg': 'imagen', '.jpeg': 'imagen', '.webp': 'imagen', '.gif': 'imagen', '.avif': 'imagen',
  '.md': 'documento', '.txt': 'documento',
  '.pdf': 'pdf',
  '.mp3': 'audio', '.ogg': 'audio', '.wav': 'audio', '.m4a': 'audio', '.flac': 'audio',
};
const EXT_IMAGEN = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.ico'];

const EXPRESIONES = {
  abiertosCerrada: 'ojos-abiertos-boca-cerrada',
  abiertosAbierta: 'ojos-abiertos-boca-abierta',
  cerradosCerrada: 'ojos-cerrados-boca-cerrada',
  cerradosAbierta: 'ojos-cerrados-boca-abierta',
} as const;

// ───────────────────────── utilidades ─────────────────────────

const aviso = (msg: string) => console.warn(`\x1b[33m[contenido]\x1b[0m ${msg}`);

function leerJson<T>(archivo: string, porDefecto: T): T {
  try {
    return JSON.parse(fs.readFileSync(archivo, 'utf8').replace(/^﻿/, '')) as T;
  } catch (e) {
    if (fs.existsSync(archivo)) aviso(`No pude leer ${path.relative(RAIZ, archivo)}: ${(e as Error).message}`);
    return porDefecto;
  }
}

function leerConfig(): ConfigFoxdiOS {
  const c = leerJson<Partial<ConfigFoxdiOS>>(ARCHIVO_CONFIG, {});
  return {
    almacenamientoExterno: { activo: false, urlBase: '', ...c.almacenamientoExterno },
    miniaturas: { tamano: 360, calidad: 72, ...c.miniaturas },
    asistente: { segundosInactividad: 120, ...c.asistente },
  };
}

/** "Fotos/Arte/mi foto.png" -> "c/Fotos/Arte/mi%20foto.png" */
const urlLocal = (ruta: string) => 'c/' + ruta.split('/').map(encodeURIComponent).join('/');
const urlExterna = (base: string, ruta: string) =>
  base.replace(/\/+$/, '') + '/' + ruta.split('/').map(encodeURIComponent).join('/');

const ocultoPorNombre = (n: string) => n.startsWith('_') || n.startsWith('.') || n === 'Thumbs.db' || n === 'desktop.ini';

/** Frontmatter sencillo: líneas "clave: valor" entre dos "---" al inicio del archivo. */
function frontmatter(texto: string): Record<string, string> {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return {};
  const datos: Record<string, string> = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const i = linea.indexOf(':');
    if (i > 0) datos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return datos;
}

const comparar = new Intl.Collator('es', { numeric: true, sensitivity: 'base' }).compare;

// ───────────────────────── miniaturas ─────────────────────────

async function hashArchivo(archivo: string) {
  const buf = await fsp.readFile(archivo);
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
}

async function miniatura(archivo: string, destinoDir: string, cfg: ConfigFoxdiOS, prefijo = '', tamano?: number) {
  const hash = await hashArchivo(archivo);
  const lado = tamano ?? cfg.miniaturas.tamano;
  const nombre = `${prefijo}${hash}-${lado}.webp`;
  const destino = path.join(destinoDir, nombre);
  let meta: { width?: number; height?: number } = {};
  try {
    meta = await sharp(archivo).metadata();
    if (!fs.existsSync(destino)) {
      await fsp.mkdir(destinoDir, { recursive: true });
      await sharp(archivo, { animated: false })
        .rotate()
        .resize(lado, lado, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: cfg.miniaturas.calidad })
        .toFile(destino);
    }
  } catch (e) {
    aviso(`No pude crear la miniatura de ${path.relative(RAIZ, archivo)}: ${(e as Error).message}`);
    return null;
  }
  return { nombre, ancho: meta.width ?? 0, alto: meta.height ?? 0 };
}

// ───────────────────────── escaneo ─────────────────────────

interface Contexto {
  base: string; // carpeta física raíz (contenido/ o contenido-externo/)
  cfg: ConfigFoxdiOS;
  externo: boolean;
  dirMinis: string;
}

const HEREDABLES: (keyof ConfigCarpeta)[] = ['acepta', 'orden', 'tipo', 'puzzle', 'fondos', 'vista'];

async function escanearCarpeta(ctx: Contexto, rutaRel: string, heredada: ConfigCarpeta): Promise<NodoCarpeta> {
  const dir = path.join(ctx.base, rutaRel);
  const propia = leerJson<ConfigCarpeta>(path.join(dir, '_carpeta.json'), {});
  const config: ConfigCarpeta = { ...Object.fromEntries(HEREDABLES.map((k) => [k, heredada[k]])), ...propia };
  for (const k of Object.keys(config) as (keyof ConfigCarpeta)[]) if (config[k] === undefined) delete config[k];

  const nombre = rutaRel ? path.basename(rutaRel) : '';
  const carpeta: NodoCarpeta = { tipo: 'carpeta', nombre, ruta: rutaRel, config, hijos: [], externo: ctx.externo || undefined };
  const entradas = (await fsp.readdir(dir, { withFileTypes: true })).filter((e) => !ocultoPorNombre(e.name));
  const urlDe = (ruta: string) => (ctx.externo ? urlExterna(ctx.cfg.almacenamientoExterno.urlBase, ruta) : urlLocal(ruta));
  const unir = (n: string) => (rutaRel ? `${rutaRel}/${n}` : n);

  // Carpeta de webs: cada subcarpeta es una página web completa.
  if (config.tipo === 'webs') {
    for (const e of entradas.filter((x) => x.isDirectory())) {
      const ruta = unir(e.name);
      const dirWeb = path.join(dir, e.name);
      if (!fs.existsSync(path.join(dirWeb, 'index.html'))) {
        aviso(`La web "${ruta}" no tiene index.html, la ignoro.`);
        continue;
      }
      const info = leerJson<{ dominio?: string; titulo?: Texto; descripcion?: Texto; icono?: string }>(path.join(dirWeb, '_web.json'), {});
      carpeta.hijos.push({
        tipo: 'web',
        nombre: e.name,
        ruta,
        dominio: (info.dominio || `${e.name.toLowerCase().replace(/\s+/g, '-')}.foxdi`).toLowerCase(),
        titulo: info.titulo || e.name,
        descripcion: info.descripcion,
        url: urlDe(`${ruta}/index.html`),
        icono: info.icono ? urlDe(`${ruta}/${info.icono}`) : undefined,
        externo: ctx.externo || undefined,
      });
    }
    ordenar(carpeta);
    return carpeta;
  }

  const archivos = entradas.filter((e) => e.isFile()).map((e) => e.name);
  const usados = new Set<string>();

  for (const e of entradas) {
    const ruta = unir(e.name);
    const abs = path.join(dir, e.name);

    if (e.isDirectory()) {
      const hija = await escanearCarpeta(ctx, ruta, config);
      // En carpetas de enlaces, las subcarpetas sin enlaces (ej. "iconos") no se muestran.
      if (config.tipo === 'enlaces' && !hija.hijos.length) continue;
      carpeta.hijos.push(hija);
      continue;
    }
    if (usados.has(e.name)) continue;
    const ext = path.extname(e.name).toLowerCase();
    const sinExt = e.name.slice(0, -ext.length);

    // Carpeta de enlaces: cada .json es un enlace; sus imágenes son iconos.
    if (config.tipo === 'enlaces') {
      if (ext !== '.json') continue;
      const d = leerJson<{ nombre?: Texto; titulo?: Texto; logo?: string; icono?: string; link?: string; url?: string; descripcion?: Texto; mostrar?: ('escritorio' | 'explorador')[] }>(abs, {});
      const url = d.url || d.link;
      if (!url) {
        aviso(`El enlace ${ruta} no tiene "url".`);
        continue;
      }
      let icono = d.icono || d.logo;
      if (!icono) icono = archivos.find((a) => a.slice(0, -path.extname(a).length) === sinExt && EXT_IMAGEN.includes(path.extname(a).toLowerCase()));
      carpeta.hijos.push({
        tipo: 'enlace',
        nombre: e.name,
        ruta,
        titulo: d.titulo || d.nombre || sinExt,
        url,
        descripcion: d.descripcion,
        icono: icono ? urlDe(unir(icono)) : undefined,
        mostrar: d.mostrar ?? ['explorador'],
        externo: ctx.externo || undefined,
      });
      continue;
    }

    const tipo = EXT[ext];
    if (!tipo) {
      if (ext !== '.json') aviso(`No sé qué hacer con "${ruta}" (formato ${ext || 'sin extensión'}), lo ignoro.`);
      continue;
    }
    if (config.acepta && !config.acepta.includes(tipo)) {
      aviso(`"${ruta}" es de tipo ${tipo}, pero la carpeta solo acepta: ${config.acepta.join(', ')}. Lo ignoro.`);
      continue;
    }
    const stat = await fsp.stat(abs);

    if (tipo === 'imagen') {
      const mini = await miniatura(abs, ctx.dirMinis, ctx.cfg);
      if (!mini) continue;
      carpeta.hijos.push({
        tipo: 'imagen', nombre: e.name, ruta, url: urlDe(ruta),
        miniatura: (ctx.externo ? 'mx/' : 'm/') + mini.nombre,
        ancho: mini.ancho, alto: mini.alto, peso: stat.size, externo: ctx.externo || undefined,
      });
    } else if (tipo === 'documento') {
      // Variantes de idioma: "cv.md" (base), "cv.en.md", "cv.es.md"
      const mIdioma = /^(.*)\.(en|es)$/.exec(sinExt);
      const raizNombre = mIdioma ? mIdioma[1] : sinExt;
      const hermanos = archivos.filter((a) => {
        const x = path.extname(a).toLowerCase();
        const s = a.slice(0, -x.length);
        return x === ext && (s === raizNombre || s === `${raizNombre}.en` || s === `${raizNombre}.es`);
      });
      hermanos.forEach((h) => usados.add(h));
      const archivoDe = (sufijo: string) => hermanos.find((h) => h.slice(0, -ext.length) === raizNombre + sufijo);
      const base = archivoDe('') ?? archivoDe('.en') ?? archivoDe('.es')!;
      const urls: { base: string; en?: string; es?: string } = { base: urlDe(unir(base)) };
      const titulo: { en?: string; es?: string } = {};
      let fecha: string | undefined;
      for (const [idioma, sufijo] of [['en', '.en'], ['es', '.es']] as const) {
        const a = archivoDe(sufijo);
        if (a) urls[idioma] = urlDe(unir(a));
      }
      if (ext === '.md') {
        for (const [idioma, a] of [['en', archivoDe('.en') ?? archivoDe('')], ['es', archivoDe('.es')]] as const) {
          if (!a) continue;
          const fm = frontmatter(await fsp.readFile(path.join(dir, a), 'utf8'));
          if (fm.titulo || fm.title) titulo[idioma] = fm.titulo || fm.title;
          fecha ??= fm.fecha || fm.date;
        }
      }
      carpeta.hijos.push({
        tipo: 'documento', nombre: raizNombre + ext, ruta: unir(base), formato: ext === '.md' ? 'md' : 'txt',
        urls, titulo: Object.keys(titulo).length ? titulo : undefined, fecha, peso: stat.size, externo: ctx.externo || undefined,
      });
    } else if (tipo === 'pdf') {
      carpeta.hijos.push({ tipo: 'pdf', nombre: e.name, ruta, url: urlDe(ruta), peso: stat.size, externo: ctx.externo || undefined });
    } else if (tipo === 'audio') {
      const info = leerJson<{ titulo?: string; artista?: string }>(path.join(dir, `${sinExt}.json`), {});
      const partes = sinExt.split(' - ');
      carpeta.hijos.push({
        tipo: 'audio', nombre: e.name, ruta, url: urlDe(ruta), peso: stat.size,
        titulo: info.titulo || (partes.length > 1 ? partes.slice(1).join(' - ') : sinExt),
        artista: info.artista || (partes.length > 1 ? partes[0] : undefined),
        externo: ctx.externo || undefined,
      });
    }
  }
  ordenar(carpeta);
  return carpeta;
}

function ordenar(c: NodoCarpeta) {
  const orden = c.config.orden ?? 'nombre';
  const fecha = (n: Nodo) => (n.tipo === 'documento' && n.fecha) || '';
  c.hijos.sort((a, b) => {
    const ca = a.tipo === 'carpeta' ? 0 : 1;
    const cb = b.tipo === 'carpeta' ? 0 : 1;
    if (ca !== cb) return ca - cb;
    if (a.tipo === 'carpeta' && b.tipo === 'carpeta') {
      const pa = a.config.prioridad ?? 100;
      const pb = b.config.prioridad ?? 100;
      if (pa !== pb) return pa - pb;
    }
    if (orden.startsWith('fecha')) {
      const r = fecha(a).localeCompare(fecha(b));
      if (r) return orden === 'fecha-desc' ? -r : r;
    }
    const r = comparar(a.nombre, b.nombre);
    return orden === 'nombre-desc' ? -r : r;
  });
}

/** Mezcla el árbol externo (R2) dentro del árbol local, carpeta por carpeta. */
function mezclar(destino: NodoCarpeta, origen: NodoCarpeta) {
  for (const h of origen.hijos) {
    const igual = destino.hijos.find((d) => d.nombre === h.nombre && d.tipo === h.tipo);
    if (h.tipo === 'carpeta' && igual?.tipo === 'carpeta') mezclar(igual, h);
    else if (!igual) destino.hijos.push(h);
  }
  ordenar(destino);
}

async function datosAsistente(raiz: NodoCarpeta, cfg: ConfigFoxdiOS): Promise<DatosAsistente> {
  const dir = path.join(DIR_CONTENIDO, 'Asistente');
  const frases = leerJson<Partial<DatosAsistente['frases']>>(path.join(dir, 'frases.json'), {});
  const limpiar = (l?: Frase[]) => (Array.isArray(l) ? l.filter((f) => f && f.en) : []);
  const expresiones: DatosAsistente['expresiones'] = {};
  for (const [clave, nombre] of Object.entries(EXPRESIONES)) {
    const archivo = ['.png', '.webp', '.gif'].map((x) => path.join(dir, nombre + x)).find((a) => fs.existsSync(a));
    if (!archivo) continue;
    // Versión más chica para que cargue rápido (el original queda intacto).
    const mini = await miniatura(archivo, DIR_CACHE, cfg, 'asistente-', 520);
    if (mini) expresiones[clave as keyof typeof EXPRESIONES] = 'm/' + mini.nombre;
  }
  void raiz;
  return {
    frases: {
      bienvenida: limpiar(frases.bienvenida),
      alHacerClick: limpiar(frases.alHacerClick),
      inactividad: limpiar(frases.inactividad),
    },
    expresiones,
  };
}

async function generarManifiesto(): Promise<Manifiesto> {
  const cfg = leerConfig();
  if (!fs.existsSync(DIR_CONTENIDO)) fs.mkdirSync(DIR_CONTENIDO, { recursive: true });
  const raiz = await escanearCarpeta({ base: DIR_CONTENIDO, cfg, externo: false, dirMinis: DIR_CACHE }, '', {});

  // Almacenamiento externo (Cloudflare R2)
  const ext = cfg.almacenamientoExterno;
  if (ext.activo) {
    let arbolExt: NodoCarpeta | null = null;
    if (fs.existsSync(DIR_EXTERNO)) {
      // Tienes las fotos pesadas en tu PC: genero miniaturas y guardo el índice para que la nube lo use.
      arbolExt = await escanearCarpeta({ base: DIR_EXTERNO, cfg, externo: true, dirMinis: DIR_MINIS_EXTERNO }, '', {});
      await fsp.mkdir(DIR_INDICE_EXTERNO, { recursive: true });
      await fsp.writeFile(path.join(DIR_INDICE_EXTERNO, 'indice.json'), JSON.stringify(arbolExt, null, 1));
    } else {
      arbolExt = leerJson<NodoCarpeta | null>(path.join(DIR_INDICE_EXTERNO, 'indice.json'), null);
    }
    if (arbolExt) mezclar(raiz, arbolExt);
  }

  return { raiz, asistente: await datosAsistente(raiz, cfg), config: cfg };
}

// ───────────────────────── plugin ─────────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.flac': 'audio/flac',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function servirCarpeta(server: ViteDevServer, prefijo: string, dir: string) {
  server.middlewares.use(prefijo, (req, res, next) => {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]);
    const archivo = path.join(dir, rel);
    if (!archivo.startsWith(dir) || !fs.existsSync(archivo) || !fs.statSync(archivo).isFile()) return next();
    res.setHeader('Content-Type', MIME[path.extname(archivo).toLowerCase()] ?? 'application/octet-stream');
    fs.createReadStream(archivo).pipe(res);
  });
}

async function copiar(origen: string, destino: string) {
  if (!fs.existsSync(origen)) return;
  await fsp.cp(origen, destino, {
    recursive: true,
    filter: (src) => !ocultoPorNombre(path.basename(src)) || src === origen || path.basename(src) === '_web.json',
  });
}

export function pluginContenido(): Plugin {
  let outDir = 'dist';
  return {
    name: 'foxdios-contenido',
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
    },
    resolveId(id) {
      if (id === ID_VIRTUAL) return ID_RESUELTO;
    },
    async load(id) {
      if (id !== ID_RESUELTO) return;
      const t = Date.now();
      const m = await generarManifiesto();
      console.log(`\x1b[36m[contenido]\x1b[0m manifiesto listo en ${Date.now() - t} ms`);
      return `export default ${JSON.stringify(m)};`;
    },
    configureServer(server) {
      servirCarpeta(server, '/c', DIR_CONTENIDO);
      servirCarpeta(server, '/m', DIR_CACHE);
      servirCarpeta(server, '/mx', DIR_MINIS_EXTERNO);
      // Vigilar cambios: agregar/borrar/editar archivos recarga la web sola.
      const vigilar = [DIR_CONTENIDO, DIR_EXTERNO, ARCHIVO_CONFIG];
      server.watcher.add(vigilar);
      let t: NodeJS.Timeout | undefined;
      const alCambiar = (archivo: string) => {
        if (!vigilar.some((v) => archivo.startsWith(v))) return;
        clearTimeout(t);
        t = setTimeout(() => {
          const mod = server.moduleGraph.getModuleById(ID_RESUELTO);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }, 250);
      };
      server.watcher.on('add', alCambiar);
      server.watcher.on('unlink', alCambiar);
      server.watcher.on('change', alCambiar);
      server.watcher.on('addDir', alCambiar);
      server.watcher.on('unlinkDir', alCambiar);
    },
    async closeBundle() {
      if (!fs.existsSync(outDir)) return;
      await copiar(DIR_CONTENIDO, path.join(outDir, 'c'));
      await copiar(DIR_CACHE, path.join(outDir, 'm'));
      await copiar(DIR_MINIS_EXTERNO, path.join(outDir, 'mx'));
      console.log('\x1b[36m[contenido]\x1b[0m contenido y miniaturas copiados a dist/');
    },
  };
}
