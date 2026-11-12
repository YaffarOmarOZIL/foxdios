import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { usePrefs } from '../sistema/preferencias';

function useAhora(cada = 1000) {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), cada);
    return () => clearInterval(id);
  }, [cada]);
  return ahora;
}

/** Reloj analógico de vidrio. */
export function Reloj() {
  const ahora = useAhora();
  const s = ahora.getSeconds();
  const m = ahora.getMinutes() + s / 60;
  const h = (ahora.getHours() % 12) + m / 60;
  return (
    <svg className="w-reloj" viewBox="0 0 120 120" width="130" height="130">
      <defs>
        <radialGradient id="wr-cara" cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".8" stopColor="#dcebf7" />
          <stop offset="1" stopColor="#a9c4dd" />
        </radialGradient>
        <linearGradient id="wr-aro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f6fa" />
          <stop offset=".5" stopColor="#8fa3b6" />
          <stop offset="1" stopColor="#e2e9f0" />
        </linearGradient>
        <linearGradient id="wr-brillo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#wr-aro)" />
      <circle cx="60" cy="60" r="50" fill="url(#wr-cara)" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="59" y="13" width="2" height={i % 3 === 0 ? 8 : 4} rx="1" fill="#4a5f75" transform={`rotate(${i * 30} 60 60)`} />
      ))}
      <text x="60" y="84" textAnchor="middle" fontSize="7" fill="#7c90a5" fontFamily="Segoe UI, sans-serif">FoxdiOS</text>
      <line x1="60" y1="60" x2="60" y2="34" stroke="#22303e" strokeWidth="4" strokeLinecap="round" transform={`rotate(${h * 30} 60 60)`} />
      <line x1="60" y1="60" x2="60" y2="22" stroke="#22303e" strokeWidth="2.6" strokeLinecap="round" transform={`rotate(${m * 6} 60 60)`} />
      <g transform={`rotate(${s * 6} 60 60)`} style={{ transition: s === 0 ? 'none' : 'transform .25s cubic-bezier(.4,2.2,.6,1)' }}>
        <line x1="60" y1="70" x2="60" y2="18" stroke="#ff7a1e" strokeWidth="1.3" />
      </g>
      <circle cx="60" cy="60" r="3.5" fill="#ff7a1e" stroke="#fff" strokeWidth="1" />
      <ellipse cx="60" cy="36" rx="40" ry="24" fill="url(#wr-brillo)" />
    </svg>
  );
}

export function Calendario() {
  const { idioma } = useT();
  const ahora = useAhora(60_000);
  const loc = idioma === 'es' ? 'es' : 'en-US';
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const primero = new Date(anio, mes, 1).getDay();
  const dias = new Date(anio, mes + 1, 0).getDate();
  const nombresDias = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(loc, { weekday: 'narrow' }));
  return (
    <div className="w-calendario">
      <div className="w-cal-cabecera">{mayuscula(ahora.toLocaleDateString(loc, { month: 'long', year: 'numeric' }).replace(' De ', ' de '))}</div>
      <div className="w-cal-grilla">
        {nombresDias.map((d, i) => (
          <b key={i}>{d}</b>
        ))}
        {Array.from({ length: primero }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: dias }, (_, i) => (
          <span key={i} className={i + 1 === ahora.getDate() ? 'hoy' : ''}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Notas() {
  const { t } = useT();
  const notas = usePrefs((s) => s.notas);
  return <textarea className="w-notas" placeholder={t('widgets.notaInicial')} value={notas} onChange={(e) => usePrefs.getState().cambiar('notas', e.target.value)} spellCheck={false} />;
}

/** Medidor de "CPU" de adorno, con dos agujas. */
export function Medidor() {
  const [v, setV] = useState({ cpu: 20, ram: 45 });
  useEffect(() => {
    const id = setInterval(
      () => setV((p) => ({ cpu: Math.max(3, Math.min(97, p.cpu + (Math.random() - 0.5) * 30)), ram: Math.max(30, Math.min(80, p.ram + (Math.random() - 0.5) * 6)) })),
      1200,
    );
    return () => clearInterval(id);
  }, []);
  const aguja = (val: number, cx: number, r: number) => {
    const a = (-120 + (val / 100) * 240) * (Math.PI / 180);
    return { x2: cx + Math.sin(a) * r, y2: 52 - Math.cos(a) * r };
  };
  const dial = (cx: number, r: number, val: number, label: string) => (
    <g>
      <circle cx={cx} cy="52" r={r} fill="#10202f" stroke="#8fa3b6" strokeWidth="2.5" />
      <path d={`M${cx - r * 0.75} ${52 + r * 0.45}A${r * 0.86} ${r * 0.86} 0 1 1 ${cx + r * 0.75} ${52 + r * 0.45}`} stroke="url(#wm-arco)" strokeWidth="3" fill="none" />
      <line x1={cx} y1="52" {...aguja(val, cx, r * 0.8)} stroke="#ff5a3a" strokeWidth="1.8" strokeLinecap="round" style={{ transition: 'all .8s' }} />
      <circle cx={cx} cy="52" r="2.5" fill="#ddd" />
      <text x={cx} y={52 + r * 0.62} textAnchor="middle" fontSize="8" fill="#9fe0ff" fontFamily="Segoe UI">{Math.round(val)}%</text>
      <text x={cx} y={52 - r * 0.35} textAnchor="middle" fontSize="6" fill="#7f95ab" fontFamily="Segoe UI">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 150 90" width="160" height="96">
      <defs>
        <linearGradient id="wm-arco" x1="0" x2="1">
          <stop offset="0" stopColor="#3fdc4a" />
          <stop offset=".6" stopColor="#ffd84a" />
          <stop offset="1" stopColor="#ff5a3a" />
        </linearGradient>
      </defs>
      {dial(52, 36, v.cpu, 'CPU')}
      {dial(118, 24, v.ram, 'RAM')}
    </svg>
  );
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
