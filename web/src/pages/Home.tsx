import { Link } from 'react-router-dom';
import SiteCard from '../components/site/SiteCard';
import { useI18n } from '../i18n';
import { bestMatch, findSite, matchesFor, useDataset } from '../lib/data';

export default function Home() {
  const { t, loc, num } = useI18n();
  const data = useDataset();
  const v = data.validation;
  const meanMars = v.mean_mars_similarity;
  // Rank by mean similarity to Mars targets, the same ordering the validation check uses.
  const sites = [...data.earth_sites].sort((a, b) => (meanMars[b.id] ?? -1) - (meanMars[a.id] ?? -1));
  const cards = sites.map((s) => {
    const best = bestMatch(data, s);
    const others = matchesFor(data, s.id)
      .filter((m) => m.target !== best?.target && m.overall !== null)
      .slice(0, 2)
      .flatMap((m) => {
        const target = findSite(data, m.target);
        return target ? [{ score: m, target }] : [];
      });
    return { site: s, best, bestTarget: findSite(data, best?.target), others };
  });
  const top = cards.reduce<(typeof cards)[number] | undefined>(
    (acc, c) => ((c.best?.overall ?? -1) > (acc?.best?.overall ?? -1) ? c : acc),
    undefined,
  );
  const marsCount = data.targets.filter((x) => x.body === 'mars').length;
  const moonCount = data.targets.filter((x) => x.body === 'moon').length;

  return (
    <div className="page">
      <section className="hero">
        <p className="kicker">{t('home.kicker')}</p>
        <h1>{t('home.heroTitle')}</h1>
        <p className="lead">{t('home.heroText')}</p>
        <div className="actions">
          <Link to="/explorer" className="btn primary">{t('home.ctaExplore')}</Link>
          <Link to="/methodology" className="btn ghost">{t('home.ctaMethod')}</Link>
        </div>
      </section>

      <section>
        <h2>{t('home.principlesTitle')}</h2>
        <div className="grid three">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel principle">
              <span className="num">{i}</span>
              <h3>{t(`home.p${i}Title`)}</h3>
              <p>{t(`home.p${i}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>{t('home.sitesTitle')}</h2>
          <p className="muted">{t('home.sitesSubtitle')}</p>
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
          {top?.best?.overall != null && (
            <li>
              <span className="stat-val">{num(top.best.overall * 100)}%</span>
              <span className="stat-label">{t('home.statTop', { site: loc(top.site.name) })}</span>
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
        <div className="grid sites">
          {cards.map((c, i) => (
            <SiteCard key={c.site.id} {...c} rank={i + 1} meanMars={meanMars[c.site.id]} featured={i === 0} />
          ))}
        </div>
      </section>

      {v.reference_rank !== null && (
        <section className="panel callout">
          <h2>{t('home.validationTitle')}</h2>
          <p>{t('home.validationText', { rank: v.reference_rank, total: v.ranking.length })}</p>
        </section>
      )}
    </div>
  );
}
