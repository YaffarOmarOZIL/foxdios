/**
 * Iconos estilo Aero dibujados en SVG (originales, sin recursos de terceros).
 * Uso: <Icono nombre="carpeta" tam={48} />. Para una carpeta con emblema: nombre="carpeta:musica".
 */
import { useId, type ReactNode } from 'react';

interface Props {
  nombre: string;
  tam?: number;
  className?: string;
}

export function Icono({ nombre, tam = 48, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const [base, emblema] = nombre.split(':');
  const g = (n: string) => `${uid}${n}`;
  const u = (n: string) => `url(#${g(n)})`;

  const defs = (
    <defs>
      <linearGradient id={g('brillo')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".9" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={g('carpeta')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe9a8" />
        <stop offset=".55" stopColor="#f6c64e" />
        <stop offset="1" stopColor="#d99a1e" />
      </linearGradient>
      <linearGradient id={g('carpetaAtras')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3c65c" />
        <stop offset="1" stopColor="#b87d14" />
      </linearGradient>
      <linearGradient id={g('azul')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fe3ff" />
        <stop offset=".5" stopColor="#2ba4e8" />
        <stop offset="1" stopColor="#0b5aa6" />
      </linearGradient>
      <linearGradient id={g('verde')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9ff9e" />
        <stop offset=".5" stopColor="#4fc23a" />
        <stop offset="1" stopColor="#1d7a1a" />
      </linearGradient>
      <linearGradient id={g('naranja')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd9a0" />
        <stop offset=".5" stopColor="#ff9a2e" />
        <stop offset="1" stopColor="#d2600a" />
      </linearGradient>
      <linearGradient id={g('rosa')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffc6ec" />
        <stop offset=".5" stopColor="#f064b8" />
        <stop offset="1" stopColor="#a8237a" />
      </linearGradient>
      <linearGradient id={g('morado')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e2c9ff" />
        <stop offset=".5" stopColor="#9b64f0" />
        <stop offset="1" stopColor="#5a26a8" />
      </linearGradient>
      <linearGradient id={g('gris')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".5" stopColor="#d7dee6" />
        <stop offset="1" stopColor="#97a5b4" />
      </linearGradient>
      <linearGradient id={g('oscuro')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5d6b7a" />
        <stop offset="1" stopColor="#1b232c" />
      </linearGradient>
      <linearGradient id={g('papel')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dfe8f2" />
      </linearGradient>
      <radialGradient id={g('orbe')} cx=".4" cy=".3" r=".75">
        <stop offset="0" stopColor="#d4ffd0" />
        <stop offset=".45" stopColor="#3fc24a" />
        <stop offset="1" stopColor="#0f6a1c" />
      </radialGradient>
      <radialGradient id={g('globo')} cx=".38" cy=".3" r=".8">
        <stop offset="0" stopColor="#d6f6ff" />
        <stop offset=".45" stopColor="#36b0ef" />
        <stop offset="1" stopColor="#0a4e94" />
      </radialGradient>
      <radialGradient id={g('sombra')} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#000" stopOpacity=".35" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  const sombra = <ellipse cx="32" cy="58" rx="22" ry="4" fill={u('sombra')} />;
  const papel = (contenido?: ReactNode, color = 'azul') => (
    <>
      {sombra}
      <path d="M14 4h26l12 12v42H14z" fill={u('papel')} stroke="#8fa3b8" strokeWidth="1.2" />
      <path d="M40 4v12h12" fill="#e9eff6" stroke="#8fa3b8" strokeWidth="1.2" />
      <rect x="14" y="48" width="38" height="10" fill={u(color)} opacity=".95" />
      {contenido}
    </>
  );

  let cuerpo: ReactNode;
  switch (base) {
    case 'carpeta': {
      const emblemas: Record<string, ReactNode> = {
        fotos: <><rect x="34" y="34" width="20" height="16" rx="2" fill="#fff" stroke="#6b8db0" /><path d="M36 48l5-7 4 5 3-3 4 5z" fill={u('verde')} /><circle cx="49" cy="38" r="2" fill="#ffcf3f" /></>,
        arte: <><circle cx="44" cy="42" r="10" fill="#fff" stroke="#8a6b46" /><circle cx="40" cy="38" r="2.4" fill="#f05454" /><circle cx="46" cy="37" r="2.4" fill="#3fa9f5" /><circle cx="49" cy="43" r="2.4" fill="#58c94a" /><circle cx="42" cy="46" r="2.6" fill="#f5f0ea" stroke="#8a6b46" /></>,
        documentos: <><path d="M36 30h14l4 4v18H36z" fill="#fff" stroke="#6b8db0" /><path d="M39 38h11M39 42h11M39 46h8" stroke="#3b82c4" strokeWidth="1.6" /></>,
        musica: <><circle cx="44" cy="42" r="11" fill={u('azul')} stroke="#0b5aa6" /><path d="M42 47V35l7-2v11" stroke="#fff" strokeWidth="2" fill="none" /><circle cx="40.5" cy="47" r="2.4" fill="#fff" /><circle cx="47.5" cy="44" r="2.4" fill="#fff" /></>,
        enlaces: <><circle cx="44" cy="42" r="11" fill="#fff" stroke="#6b8db0" /><path d="M39 45l10-10m-6 0h6v6" stroke="#1f8fd6" strokeWidth="2.6" fill="none" strokeLinecap="round" /></>,
        webs: <><circle cx="44" cy="42" r="11" fill={u('globo')} /><path d="M33 42h22M44 31c-6 7-6 15 0 22m0-22c6 7 6 15 0 22" stroke="#e8f8ff" strokeWidth="1.2" fill="none" /></>,
        trabajo: <><rect x="33" y="36" width="22" height="15" rx="2.5" fill={u('naranja')} stroke="#9a4a08" /><path d="M40 36v-3h8v3" stroke="#9a4a08" strokeWidth="2" fill="none" /><rect x="42" y="41" width="4" height="3" fill="#fff" /></>,
        proyectos: <><path d="M44 30l3.5 7.5 8 1-6 5.5 1.6 8L44 48l-7.1 4 1.6-8-6-5.5 8-1z" fill={u('naranja')} stroke="#a85a0a" /></>,
        papelera: null,
      };
      cuerpo = (
        <>
          {sombra}
          <path d="M6 14a3 3 0 0 1 3-3h14l5 5h27a3 3 0 0 1 3 3v33a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill={u('carpetaAtras')} />
          <rect x="11" y="18" width="42" height="26" rx="1.5" fill="#fff" transform="rotate(-4 32 30)" opacity=".95" />
          <path d="M4 24a3 3 0 0 1 3-3h50a3 3 0 0 1 3 3l-3 28a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" fill={u('carpeta')} />
          <path d="M5 24a3 3 0 0 1 3-2.5h48a3 3 0 0 1 3 2.5l-.8 8H5.8z" fill={u('brillo')} opacity=".7" />
          {emblema && emblemas[emblema]}
        </>
      );
      break;
    }
    case 'equipo':
      cuerpo = (
        <>
          {sombra}
          <rect x="8" y="8" width="48" height="34" rx="3" fill={u('oscuro')} />
          <rect x="11" y="11" width="42" height="27" rx="1" fill={u('globo')} />
          <path d="M11 11h42v10c-14 6-28 6-42 0z" fill={u('brillo')} opacity=".55" />
          <path d="M26 42h12l3 8H23z" fill={u('gris')} />
          <rect x="16" y="50" width="32" height="5" rx="2" fill={u('gris')} stroke="#7d8b99" strokeWidth=".8" />
        </>
      );
      break;
    case 'imagen':
      cuerpo = (
        <>
          {sombra}
          <rect x="7" y="10" width="50" height="42" rx="3" fill="#fff" stroke="#8fa3b8" />
          <rect x="11" y="14" width="42" height="34" fill="#8fd3ff" />
          <circle cx="44" cy="22" r="5" fill="#fff4a8" />
          <path d="M11 48l14-18 10 12 6-6 12 12z" fill={u('verde')} />
          <path d="M11 14h42v12c-14 4-28 4-42 0z" fill={u('brillo')} opacity=".5" />
        </>
      );
      break;
    case 'documento':
      cuerpo = papel(<path d="M19 20h20M19 26h27M19 32h27M19 38h18" stroke="#6d8aa8" strokeWidth="2" strokeLinecap="round" />);
      break;
    case 'texto':
      cuerpo = papel(<path d="M19 20h27M19 26h27M19 32h27M19 38h27M19 44h14" stroke="#9aaabb" strokeWidth="1.6" />, 'gris');
      break;
    case 'pdf':
      cuerpo = papel(
        <>
          <path d="M19 20h27M19 26h20" stroke="#9aaabb" strokeWidth="2" />
          <text x="33" y="56" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">PDF</text>
        </>,
        'rosa',
      );
      break;
    case 'audio':
      cuerpo = papel(
        <>
          <path d="M30 40V22l12-3v17" stroke="#1f6fb8" strokeWidth="2.6" fill="none" />
          <circle cx="27" cy="40" r="4" fill="#1f6fb8" />
          <circle cx="39" cy="37" r="4" fill="#1f6fb8" />
        </>,
      );
      break;
    case 'musica':
      cuerpo = (
        <>
          {sombra}
          <circle cx="32" cy="31" r="25" fill={u('naranja')} />
          <circle cx="32" cy="31" r="20" fill="#fff" opacity=".18" />
          <path d="M27 40V19l15-4v20" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
          <circle cx="23" cy="40" r="5" fill="#fff" />
          <circle cx="38" cy="36" r="5" fill="#fff" />
          <ellipse cx="32" cy="17" rx="18" ry="9" fill={u('brillo')} opacity=".6" />
        </>
      );
      break;
    case 'navegador':
    case 'web':
      cuerpo = (
        <>
          {sombra}
          <circle cx="32" cy="30" r="25" fill={u('globo')} />
          <path d="M18 18c6 2 8 8 4 12s2 8 6 10-2 10-4 12M38 8c-2 6 4 8 8 8s6 6 4 10-6 2-8 6 4 8 2 12" fill="none" stroke="#5fd17a" strokeWidth="5" strokeLinecap="round" opacity=".85" />
          <ellipse cx="30" cy="16" rx="18" ry="9" fill={u('brillo')} opacity=".65" />
          {base === 'navegador' && <path d="M6 40c14 10 40 10 52-14" stroke="#ff9a2e" strokeWidth="4" fill="none" strokeLinecap="round" />}
        </>
      );
      break;
    case 'enlace':
      cuerpo = (
        <>
          {sombra}
          <rect x="8" y="8" width="48" height="46" rx="10" fill={u('azul')} />
          <path d="M22 40l18-18m-12 0h12v12" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 18a10 10 0 0 1 10-10h28a10 10 0 0 1 10 10v4c-16 6-32 6-48 0z" fill={u('brillo')} opacity=".5" />
        </>
      );
      break;
    case 'configuracion':
      cuerpo = (
        <>
          {sombra}
          <path
            d="M32 6l5 1 1 6 4 2 5-4 5 4-3 6 2 4 6 1 1 6-6 2-1 4 4 5-4 5-6-3-4 2-1 6-6 1-2-6-4-1-5 4-5-4 3-6-2-4-6-1v-6l6-2 1-4-4-5 4-5 6 3 4-2 1-6z"
            fill={u('gris')} stroke="#6f7f90" strokeWidth="1.2" transform="translate(0 -1)"
          />
          <circle cx="32" cy="30" r="9" fill={u('azul')} stroke="#0b5aa6" />
          <ellipse cx="30" cy="16" rx="14" ry="6" fill={u('brillo')} opacity=".5" />
        </>
      );
      break;
    case 'bienvenida':
      cuerpo = (
        <>
          {sombra}
          <circle cx="32" cy="30" r="25" fill={u('verde')} />
          <path d="M32 18a4 4 0 1 1 0 .1zM28 26h7v16h3v4H26v-4h3V30h-1z" fill="#fff" />
          <ellipse cx="32" cy="16" rx="17" ry="8" fill={u('brillo')} opacity=".6" />
        </>
      );
      break;
    case 'papelera':
      cuerpo = (
        <>
          {sombra}
          <path d="M14 16h36l-4 40H18z" fill="#cfe9ff" fillOpacity=".55" stroke="#7aa7cf" strokeWidth="1.5" />
          <path d="M20 22l3 30M32 22v30M44 22l-3 30" stroke="#9cc2e4" strokeWidth="1.5" />
          <path d="M22 26h8l-2 18h-5zM33 28h9l-3 14h-6z" fill="#fff" opacity=".9" />
          <ellipse cx="32" cy="16" rx="19" ry="4" fill="#e9f5ff" stroke="#7aa7cf" strokeWidth="1.5" />
          <path d="M16 20h6l-1 30" stroke="#fff" strokeWidth="2" opacity=".7" fill="none" />
        </>
      );
      break;
    case 'celular':
      cuerpo = (
        <>
          {sombra}
          <rect x="18" y="4" width="28" height="52" rx="6" fill={u('oscuro')} />
          <rect x="21" y="10" width="22" height="38" rx="1.5" fill={u('globo')} />
          <circle cx="32" cy="52" r="2" fill="#9fb2c4" />
          <rect x="28" y="6.5" width="8" height="1.5" rx=".7" fill="#7c8a99" />
          <path d="M21 10h22v14c-8 4-15 4-22 0z" fill={u('brillo')} opacity=".55" />
          <circle cx="27" cy="34" r="3" fill="#fff" opacity=".8" /><circle cx="37" cy="34" r="3" fill="#fff" opacity=".8" />
          <circle cx="27" cy="42" r="3" fill="#fff" opacity=".8" /><circle cx="37" cy="42" r="3" fill="#fff" opacity=".8" />
        </>
      );
      break;
    case 'asistente':
      cuerpo = (
        <>
          {sombra}
          <path d="M12 8l12 14h16l12-14 2 22-8 16-14 8-14-8-8-16z" fill={u('naranja')} stroke="#9a4a08" strokeWidth="1.2" />
          <path d="M16 13l6 9-4 3zM48 13l-6 9 4 3z" fill="#4a2e14" />
          <path d="M20 38l12 14 12-14-6-2h-12z" fill="#fff6e8" />
          <circle cx="25" cy="31" r="3" fill="#3a2410" /><circle cx="39" cy="31" r="3" fill="#3a2410" />
          <circle cx="25.8" cy="30" r="1" fill="#fff" /><circle cx="39.8" cy="30" r="1" fill="#fff" />
          <path d="M30 40h4l-2 3z" fill="#2b1a0b" />
        </>
      );
      break;
    case 'proximamente':
      cuerpo = (
        <>
          {sombra}
          <circle cx="32" cy="30" r="25" fill={u('morado')} />
          <circle cx="32" cy="30" r="17" fill="#fff" opacity=".9" />
          <path d="M32 18v12l8 5" stroke="#5a26a8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="30" cy="15" rx="16" ry="7" fill={u('brillo')} opacity=".55" />
        </>
      );
      break;
    case 'juegos':
      cuerpo = (
        <>
          {sombra}
          <path d="M10 26a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10l3 16a7 7 0 0 1-12 5l-5-6H24l-5 6a7 7 0 0 1-12-5z" fill={u('morado')} stroke="#4b1f8c" />
          <path d="M18 27h8m-4-4v8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="42" cy="25" r="2.6" fill="#ffdd57" /><circle cx="47" cy="30" r="2.6" fill="#57d4ff" />
          <path d="M14 22c8-6 28-6 36 0" stroke="#fff" strokeOpacity=".6" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case 'mensajero':
      cuerpo = (
        <>
          {sombra}
          <circle cx="24" cy="26" r="12" fill={u('verde')} />
          <path d="M8 54c0-12 8-18 16-18s16 6 16 18z" fill={u('verde')} />
          <circle cx="40" cy="22" r="11" fill={u('azul')} />
          <path d="M26 54c0-11 7-17 14-17s14 6 14 17z" fill={u('azul')} />
          <ellipse cx="22" cy="20" rx="7" ry="4" fill="#fff" opacity=".55" /><ellipse cx="38" cy="17" rx="6" ry="3.5" fill="#fff" opacity=".55" />
        </>
      );
      break;
    case 'calculadora':
      cuerpo = (
        <>
          {sombra}
          <rect x="14" y="6" width="36" height="50" rx="5" fill={u('gris')} stroke="#6f7f90" />
          <rect x="18" y="10" width="28" height="12" rx="2" fill="#cfeee0" stroke="#6f9f86" />
          {[0, 1, 2].map((f) => [0, 1, 2].map((c) => <rect key={`${f}${c}`} x={18 + c * 10} y={26 + f * 9} width="8" height="7" rx="1.5" fill={c === 2 ? '#ff9a2e' : '#fff'} stroke="#8fa0b2" strokeWidth=".6" />))}
        </>
      );
      break;
    case 'flip':
      cuerpo = (
        <>
          <rect x="22" y="8" width="34" height="26" rx="3" fill={u('azul')} opacity=".55" transform="skewY(-8)" />
          <rect x="15" y="16" width="34" height="26" rx="3" fill={u('azul')} opacity=".75" transform="skewY(-8)" />
          <rect x="8" y="26" width="34" height="26" rx="3" fill={u('azul')} stroke="#fff" strokeWidth="1.5" transform="skewY(-8)" />
        </>
      );
      break;
    default:
      cuerpo = papel();
  }

  return (
    <svg className={className} width={tam} height={tam} viewBox="0 0 64 64" aria-hidden="true">
      {defs}
      {cuerpo}
    </svg>
  );
}

/** Icono que corresponde a un nodo del contenido. */
export function iconoDeNodo(n: { tipo: string; config?: { icono?: string; tipo?: string }; formato?: string }): string {
  if (n.tipo === 'carpeta') {
    const e = n.config?.icono ?? (n.config?.tipo === 'enlaces' ? 'enlaces' : n.config?.tipo === 'webs' ? 'webs' : n.config?.tipo === 'musica' ? 'musica' : '');
    if (e === 'papelera') return 'papelera';
    return e ? `carpeta:${e}` : 'carpeta';
  }
  if (n.tipo === 'documento') return n.formato === 'txt' ? 'texto' : 'documento';
  return n.tipo;
}
