import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useDataset } from '../lib/data';

const NAV = [
  { to: '/', key: 'home', end: true },
  { to: '/explorer', key: 'explorer' },
  { to: '/compare', key: 'compare' },
  { to: '/methodology', key: 'methodology' },
  { to: '/sources', key: 'sources' },
];

export default function Layout() {
  const { t, toggle } = useI18n();
  const data = useDataset();
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <circle cx="12" cy="16" r="10" fill="#3fb6a8" />
            <circle cx="22" cy="16" r="8" fill="#e0703f" opacity="0.92" />
          </svg>
          <span>{t('app.title')}</span>
        </NavLink>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.key} to={n.to} end={n.end}>
              {t(`nav.${n.key}`)}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn ghost small lang" onClick={toggle} aria-label={t('lang.switchLabel')}>
          {t('lang.switch')}
        </button>
      </header>
      {data.provisional && (
        <div className="banner">
          {data.measured_share ? t('app.partial', { pct: Math.round(data.measured_share * 100) }) : t('app.provisional')}
        </div>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
