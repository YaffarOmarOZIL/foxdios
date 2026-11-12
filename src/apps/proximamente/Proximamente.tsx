import { useEffect } from 'react';
import { useT, type ClaveTexto } from '../../i18n';
import { Icono } from '../../sistema/iconos/Icono';
import { useVentana } from '../../sistema/ventanas/contexto';

/** Ventana de relleno para apps que todavía no existen. */
export default function Proximamente() {
  const { t } = useT();
  const v = useVentana();
  const nombre = (v.props.nombre as ClaveTexto) ?? 'apps.proximamente';
  useEffect(() => v.setTitulo(t(nombre)), [nombre, t, v]);
  return (
    <div style={{ height: '100%', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 8, padding: 20, textAlign: 'center', background: 'linear-gradient(#fff, #eaf3fb)' }}>
      <div style={{ animation: 'llamar 2.4s ease-in-out infinite' }}>
        <Icono nombre={(v.props.icono as string) ?? 'proximamente'} tam={72} />
      </div>
      <h2 style={{ margin: 0, fontWeight: 400, color: '#1a5c99' }}>{t('proximamente.titulo')}</h2>
      <p style={{ margin: 0, color: 'var(--texto-suave)' }}>{t('proximamente.texto')}</p>
    </div>
  );
}
