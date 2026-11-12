/**
 * Barra lateral de gadgets estilo Vista. Para crear un gadget nuevo:
 * haz un componente en src/widgets/ y agrégalo a GADGETS (y su nombre en i18n 'widgets.x').
 */
import { useEffect, useState, type ComponentType } from 'react';
import { useT, type ClaveTexto } from '../i18n';
import { useSistema } from '../sistema/estado';
import { usePrefs } from '../sistema/preferencias';
import { sonidos } from '../sistema/sonido';
import { Calendario, Medidor, Notas, Reloj } from './Basicos';
import { MarcoFotos } from './MarcoFotos';
import { Puzzle } from './Puzzle';
import './widgets.css';

export const GADGETS: Record<string, { nombre: ClaveTexto; componente: ComponentType; icono: string }> = {
  reloj: { nombre: 'widgets.reloj', componente: Reloj, icono: '🕒' },
  calendario: { nombre: 'widgets.calendario', componente: Calendario, icono: '📅' },
  puzzle: { nombre: 'widgets.puzzle', componente: Puzzle, icono: '🧩' },
  marco: { nombre: 'widgets.marco', componente: MarcoFotos, icono: '🖼️' },
  notas: { nombre: 'widgets.notas', componente: Notas, icono: '📝' },
  medidor: { nombre: 'widgets.medidor', componente: Medidor, icono: '📈' },
};

export function BarraWidgets() {
  const { t } = useT();
  const visible = usePrefs((s) => s.gadgets);
  const lista = usePrefs((s) => s.listaGadgets);
  const [galeria, setGaleria] = useState(false);
  const anchoPantalla = useSistema((s) => s.pantalla.w);

  useEffect(() => {
    if (!galeria) return;
    const cerrar = () => setGaleria(false);
    window.addEventListener('pointerdown', cerrar);
    return () => window.removeEventListener('pointerdown', cerrar);
  }, [galeria]);

  if (!visible || anchoPantalla < 700) return null;
  const cambiar = (l: string[]) => usePrefs.getState().cambiar('listaGadgets', l);

  return (
    <aside className="barra-widgets">
      <div className="bw-cabecera">
        <button className="bw-mas" title={t('widgets.agregar')} onPointerDown={(e) => e.stopPropagation()} onClick={() => (sonidos.click(), setGaleria(!galeria))}>
          +
        </button>
        {galeria && (
          <div className="bw-galeria" onPointerDown={(e) => e.stopPropagation()}>
            <b>{t('widgets.agregar')}</b>
            {Object.entries(GADGETS).map(([id, g]) => {
              const puesto = lista.includes(id);
              return (
                <button key={id} className={puesto ? 'puesto' : ''} onClick={() => (sonidos.click(), cambiar(puesto ? lista.filter((x) => x !== id) : [...lista, id]))}>
                  <span>{g.icono}</span> {t(g.nombre)} {puesto && '✓'}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="bw-lista">
        {lista.map((id, i) => {
          const g = GADGETS[id];
          if (!g) return null;
          const C = g.componente;
          return (
            <div key={id} className="gadget" style={{ animationDelay: `${i * 90}ms` }}>
              <button className="gadget-quitar" title={t('widgets.quitar')} onClick={() => (sonidos.cerrar(), cambiar(lista.filter((x) => x !== id)))}>
                ×
              </button>
              <C />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
