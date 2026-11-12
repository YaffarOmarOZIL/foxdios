import { create } from 'zustand';

/** Preferencias del visitante. Se guardan en su navegador (si se puede). */
export interface Preferencias {
  idioma: 'en' | 'es';
  aspecto: 'completa' | '16:9' | '4:3';
  volumen: number; // 0..1 volumen general
  efectos: boolean; // sonidos de la interfaz
  volMusica: number; // 0..1
  musicaActiva: boolean; // si la música arranca al iniciar sesión
  burbujas: boolean;
  animaciones: boolean;
  fondo: string; // id de fondo integrado o url de una imagen de contenido
  gadgets: boolean;
  listaGadgets: string[];
  asistente: boolean;
  frasesInactividad: boolean;
  bienvenidaAlInicio: boolean;
  modo: 'escritorio' | 'movil';
  notas: string;
}

const PORDEFECTO: Preferencias = {
  idioma: 'en',
  aspecto: 'completa',
  volumen: 0.7,
  efectos: true,
  volMusica: 0.35,
  musicaActiva: true,
  burbujas: true,
  animaciones: true,
  fondo: 'cielo',
  gadgets: true,
  listaGadgets: ['reloj', 'calendario', 'puzzle'],
  asistente: true,
  frasesInactividad: true,
  bienvenidaAlInicio: true,
  modo: 'escritorio',
  notas: '',
};

const CLAVE = 'foxdios:preferencias';

function cargar(): Preferencias {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    const p = { ...PORDEFECTO, ...guardado } as Preferencias;
    // Primera visita: si el navegador está en español, empezamos en español.
    if (!guardado.idioma && navigator.language?.toLowerCase().startsWith('es')) p.idioma = 'es';
    return p;
  } catch {
    return { ...PORDEFECTO };
  }
}

interface EstadoPrefs extends Preferencias {
  cambiar: <K extends keyof Preferencias>(clave: K, valor: Preferencias[K]) => void;
}

export const usePrefs = create<EstadoPrefs>((set, get) => ({
  ...cargar(),
  cambiar: (clave, valor) => {
    set({ [clave]: valor } as Partial<EstadoPrefs>);
    try {
      const { cambiar: _c, ...datos } = get();
      void _c;
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      /* modo privado o almacenamiento bloqueado: no pasa nada */
    }
  },
}));
