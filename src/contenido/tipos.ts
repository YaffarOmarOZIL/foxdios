// Tipos compartidos entre el escáner de contenido (scripts/plugin-contenido.ts) y la web.

/** Un texto que puede venir en un solo idioma o traducido. */
export type Texto = string | { en?: string; es?: string };

export type TipoArchivo = 'imagen' | 'documento' | 'pdf' | 'audio' | 'enlace' | 'web';

/** Lo que puedes poner en un archivo `_carpeta.json`. Todo es opcional y se hereda a las subcarpetas (salvo nombre, icono, oculta y escritorio). */
export interface ConfigCarpeta {
  /** Nombre que se muestra (si no, se usa el nombre real de la carpeta). Ej: { "en": "Photos", "es": "Fotos" } */
  nombre?: Texto;
  /** Icono: carpeta | fotos | documentos | musica | enlaces | webs | trabajo | proyectos | arte */
  icono?: string;
  /** Qué tipos de archivo acepta. Lo demás se ignora con un aviso en la consola. */
  acepta?: TipoArchivo[];
  /** Cómo ordenar: nombre (por defecto), nombre-desc, fecha, fecha-desc (fecha = la de los documentos). */
  orden?: 'nombre' | 'nombre-desc' | 'fecha' | 'fecha-desc';
  /** Tipo especial de carpeta. */
  tipo?: 'enlaces' | 'webs' | 'musica';
  /** No se muestra en el explorador (pero la web la puede usar). */
  oculta?: boolean;
  /** Mostrar esta carpeta también como icono en el escritorio. */
  escritorio?: boolean;
  /** Las imágenes de aquí se usan en el widget de puzzle. */
  puzzle?: boolean;
  /** Las imágenes de aquí se ofrecen como fondo de pantalla. */
  fondos?: boolean;
  /** Vista inicial del explorador. */
  vista?: 'iconos' | 'lista';
  /** Prioridad para ordenar carpetas (menor = primero). */
  prioridad?: number;
}

interface NodoBase {
  /** Ruta relativa dentro de contenido/, también sirve de id. Ej: "Fotos/Arte/zorro.png" */
  ruta: string;
  /** Nombre del archivo o carpeta tal cual. */
  nombre: string;
  /** Viene de almacenamiento externo (R2). */
  externo?: boolean;
}

export interface NodoCarpeta extends NodoBase {
  tipo: 'carpeta';
  config: ConfigCarpeta;
  hijos: Nodo[];
}

export interface NodoImagen extends NodoBase {
  tipo: 'imagen';
  url: string;
  miniatura: string;
  ancho: number;
  alto: number;
  peso: number;
}

export interface NodoDocumento extends NodoBase {
  tipo: 'documento';
  formato: 'md' | 'txt';
  /** url por idioma; "base" se usa si no hay del idioma pedido. */
  urls: { base: string; en?: string; es?: string };
  titulo?: Texto;
  fecha?: string;
  peso: number;
}

export interface NodoPdf extends NodoBase {
  tipo: 'pdf';
  url: string;
  peso: number;
}

export interface NodoAudio extends NodoBase {
  tipo: 'audio';
  url: string;
  titulo: string;
  artista?: string;
  peso: number;
}

export interface NodoEnlace extends NodoBase {
  tipo: 'enlace';
  titulo: Texto;
  url: string;
  icono?: string;
  descripcion?: Texto;
  mostrar: ('escritorio' | 'explorador')[];
}

export interface NodoWeb extends NodoBase {
  tipo: 'web';
  dominio: string;
  titulo: Texto;
  descripcion?: Texto;
  url: string;
  icono?: string;
}

export type Nodo = NodoCarpeta | NodoImagen | NodoDocumento | NodoPdf | NodoAudio | NodoEnlace | NodoWeb;

export interface Frase {
  en: string;
  es?: string;
}

export interface DatosAsistente {
  frases: {
    bienvenida: Frase[];
    alHacerClick: Frase[];
    inactividad: Frase[];
  };
  expresiones: {
    abiertosCerrada?: string;
    abiertosAbierta?: string;
    cerradosCerrada?: string;
    cerradosAbierta?: string;
  };
}

export interface ConfigFoxdiOS {
  almacenamientoExterno: { activo: boolean; urlBase: string };
  miniaturas: { tamano: number; calidad: number };
  asistente: { segundosInactividad: number };
}

export interface Manifiesto {
  raiz: NodoCarpeta;
  asistente: DatosAsistente;
  config: ConfigFoxdiOS;
}
