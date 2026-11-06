import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import SpaceHero from '../components/hero/SpaceHero';
import TwinSlider from '../components/home/TwinSlider';
import { useI18n } from '../i18n';
import { bestMatch, findSite, useDataset } from '../lib/data';

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** Icons for the ground rules: Mars first, same scale, honest about limits. */
const RULE_ICONS = [
  svg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M3 14c3-1.2 6.5-1.6 10-1.2s6.5 1.2 8 2" />
    </>,
  ),
  svg(
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16" />
    </>,
  ),
  svg(
    <>
      <path d="M12 4v16M7 20h10M5 7h14" />
      <path d="M5 7l-3 6a3 3 0 006 0zM19 7l-3 6a3 3 0 006 0z" />
    </>,
  ),
];

/** Icons for "How it works": data in, common grid, score with confidence. */
const HOW_ICONS = [
  svg(
    <>
      <path d="M4 15a8 8 0 0116 0" />
      <path d="M12 15l4-5" />
      <circle cx="12" cy="15" r="1.3" />
      <path d="M8 20h8" />
    </>,
  ),
  svg(
    <>
      <path d="M3 17l5-6 4 3 4-6 5 6" />
      <path d="M3 21h18" />
    </>,
  ),
  svg(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 018 8h-8z" fill="currentColor" stroke="none" opacity="0.35" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5" />
    </>,
  ),
];

/** Icons for "Why it matters": mission planners, Oman, open research. */
const IMPACT_ICONS = [
  svg(
    <>
      <path d="M12 3c3 2.5 4.5 6 4.5 10l-2 3h-5l-2-3C7.5 9 9 5.5 12 3z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M9.5 16l-2 4M14.5 16l2 4" />
    </>,
  ),
  svg(
    <>
      <path d="M12 21s-6-5.3-6-10a6 6 0 0112 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </>,
  ),
  svg(
    <>
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />
    </>,
  ),
];

export default function Home() {
  const { t, loc, num, lang } = useI18n();
  const data = useDataset();
  const v = data.validation;
  const meanMars = v.mean_mars_similarity;
  // Rank by mean similarity to Mars targets, the same ordering the validation check uses.
  const sites = [...data.earth_sites].sort((a, b) => (meanMars[b.id] ?? -1) - (meanMars[a.id] ?? -1));
  // Compact gallery: the home page tells the story; full breakdowns live on the site pages and in the explorer.
  const tiles = sites.map((s) => {
    const best = bestMatch(data, s);
    return { site: s, best, twin: findSite(data, best?.target) };
  });
  // Headline stat follows the same ranking as the cards: the site with the best mean Mars similarity.
  const top = sites.find((s) => meanMars[s.id] != null);
  const topMean = top ? meanMars[top.id] : null;
  const marsCount = data.targets.filter((x) => x.body === 'mars').length;
  const moonCount = data.targets.filter((x) => x.body === 'moon').length;
  const ranked = v.ranking.flatMap((id) => {
    const site = findSite(data, id);
    return site ? [{ site, mean: meanMars[id] ?? null }] : [];
  });

  return (
    <>
      <SpaceHero earthSites={data.earth_sites.length} marsTargets={marsCount} />
      <div className="page">
        <section id="rules">
          <h2>{t('home.principlesTitle')}</h2>
          <div className="grid three">
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel principle">
                <span className="icon-badge">{RULE_ICONS[i - 1]}</span>
                <h3>{t(`home.p${i}Title`)}</h3>
                <p>{t(`home.p${i}Text`)}</p>
              </div>
            ))}
          </div>
        </section>

        <TwinSlider data={data} />

        <section className="how" aria-labelledby="how-title">
          <h2 id="how-title">{t('home.howTitle')}</h2>
          <ol className="how-steps">
            {[1, 2, 3].map((i) => (
              <li key={i} className="how-step">
                <span className="icon-badge earth">{HOW_ICONS[i - 1]}</span>
                <div>
                  <h3>
                    <span className="how-num">{num(i)}</span> {t(`home.how${i}Title`)}
                  </h3>
                  <p>{t(`home.how${i}Text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="sites">
          <div className="section-head">
            <h2>{t('home.galleryTitle')}</h2>
            <p className="muted">{t('home.gallerySubtitle')}</p>
          </div>
          <ul className="stats">
            <li>
              <span className="stat-val">{num(data.earth_sites.length)}</span>
              <span className="stat-label">{t('home.statSites')}</span>
            </li>
            <li>
              <span className="stat-val">{num(data.targets.length)}</span>
              <span className="stat-label">{t('home.statTargets', { mars: marsCount, moon: moonCount })}</span>
            </li>
            {top && topMean != null && (
              <li>
                <span className="stat-val">{num(topMean * 100)}%</span>
                <span className="stat-label">{t('home.statBestMean', { site: loc(top.name) })}</span>
              </li>
            )}
            {v.reference_rank !== null && (
              <li>
                <span className="stat-val">
                  #{v.reference_rank}
                  <small> / {v.ranking.length}</small>
                </span>
                <span className="stat-label">{t('home.statRef')}</span>
              </li>
            )}
          </ul>
          <ol className="gallery">
            {tiles.map(({ site, best, twin }, i) => (
              <li key={site.id}>
                <Link to={`/site/${site.id}`} className={`tile${i === 0 ? ' lead-tile' : ''}${site.role === 'reference' ? ' is-ref' : ''}`} aria-label={`${loc(site.name)} · ${t('home.galleryOpen')}`}>
                  <span className="tile-img" aria-hidden="true">
                    <img src={`${import.meta.env.BASE_URL}layers/${site.id}/elevation.png`} alt="" loading="lazy" draggable={false} />
                  </span>
                  <span className="tile-body">
                    <span className="tile-top">
                      <span className="rank">#{i + 1}</span>
                      {site.role === 'reference' && <span className="pill ref">{t('explorer.reference')}</span>}
                      {meanMars[site.id] != null && (
                        <span className="tile-mean">
                          {t('home.meanMars')} <strong>{num(meanMars[site.id]! * 100)}%</strong>
                        </span>
                      )}
                    </span>
                    <span className="tile-name">{loc(site.name)}</span>
                    <span className="tile-summary">{site.card[lang].summary}</span>
                    {best && twin && (
                      <span className="tile-twin">
                        <span className="muted">{t(twin.body === 'moon' ? 'home.galleryMoonTwin' : 'home.galleryTwin')}</span>
                        <span className="tile-twin-row">
                          <span>
                            <span className={`dot ${twin.body}`} /> {loc(twin.name)}
                          </span>
                          {best.overall != null && <strong className="tile-score">{num(best.overall * 100)}%</strong>}
                        </span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {v.reference_rank !== null && (
          <section className="panel callout validation">
            <h2>{t('home.validationTitle')}</h2>
            <p>{t('home.validationText', { rank: v.reference_rank, total: v.ranking.length })}</p>
            <ol className="rank-strip">
              {ranked.map(({ site, mean }, i) => {
                const isRef = site.id === v.reference_site;
                return (
                  <li key={site.id} className={isRef ? 'is-ref' : undefined}>
                    <span className="rank-pos">#{i + 1}</span>
                    <span className="rank-name">
                      {loc(site.name)}
                      {isRef && <span className="pill ref">{t('home.validationRef')}</span>}
                    </span>
                    <span className="rank-bar" aria-hidden="true">
                      <i style={{ width: `${Math.max(0, (mean ?? 0) * 100)}%` }} />
                    </span>
                    <span className="rank-val">{mean == null ? t('metric.notAvailable') : `${num(mean * 100)}%`}</span>
                  </li>
                );
              })}
            </ol>
            <p className="muted small">{t('home.validationWhy')}</p>
          </section>
        )}

        <section className="impact" aria-labelledby="impact-title">
          <div className="section-head">
            <h2 id="impact-title">{t('home.impactTitle')}</h2>
            <p className="muted">{t('home.impactSubtitle')}</p>
          </div>
          <div className="grid three">
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel impact-card">
                <span className="icon-badge mars">{IMPACT_ICONS[i - 1]}</span>
                <h3>{t(`home.impact${i}Title`)}</h3>
                <p>{t(`home.impact${i}Text`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel cta-band">
          <div>
            <h2>{t('home.ctaTitle')}</h2>
            <p className="muted">{t('home.ctaText')}</p>
          </div>
          <div className="actions">
            <Link to="/explorer?view=targets" className="btn primary">{t('explorer.tab_targets')}</Link>
            <Link to="/explorer" className="btn ghost">{t('home.ctaExplore')}</Link>
          </div>
        </section>
      </div>
    </>
  );
}
