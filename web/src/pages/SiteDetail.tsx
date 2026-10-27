import { Link, useParams } from 'react-router-dom';
import CriteriaRadar from '../components/charts/CriteriaRadar';
import ScoreBadge, { ScoreBar } from '../components/similarity/ScoreBadge';
import { useI18n } from '../i18n';
import { analogsFor, bestMatch, findSite, matchesFor, useDataset } from '../lib/data';
import { formatCoords } from '../lib/geo';

const BODY_HEX = { earth: '#3fb6a8', mars: '#e0703f', moon: '#b8c2d6' } as const;

export default function SiteDetail() {
  const { id } = useParams();
  const { t, loc, lang, num } = useI18n();
  const data = useDataset();
  const site = findSite(data, id);

  if (!site) {
    return (
      <div className="page">
        <p>{t('site.notFound')}</p>
        <Link to="/explorer">{t('site.back')}</Link>
      </div>
    );
  }

  const isEarth = site.body === 'earth';
  const ranked = isEarth ? matchesFor(data, site.id) : analogsFor(data, site.id);
  const headline = isEarth ? bestMatch(data, site) : ranked[0];
  const counterpart = findSite(data, headline ? (isEarth ? headline.target : headline.earth) : null);
  const card = site.card[lang];
  const criteria = Object.keys(data.config.criteria);
  const features = Object.values(data.config.criteria).flatMap((c) => c.features);

  return (
    <div className="page">
      <Link to={isEarth ? `/explorer?site=${site.id}` : '/explorer'} className="back">← {t('site.back')}</Link>

      <header className="detail-head">
        <div>
          <p className="kicker">
            <span className={`dot ${site.body}`} /> {t(`body.${site.body}`)}
            {isEarth && ` · ${t(site.role === 'reference' ? 'site.role_reference' : 'site.role_analog')}`}
          </p>
          <h1>{loc(site.name)}</h1>
          <p className="coords-line muted">{t('site.coords')}: <bdi dir="ltr">{formatCoords(site.lat, site.lon)}</bdi></p>
        </div>
        {headline && counterpart && (
          <div className="detail-score">
            <ScoreBadge overall={headline.overall} confidence={headline.confidence} size="lg" />
            <span className="muted">{t('site.profileVs', { name: loc(counterpart.name) })}</span>
          </div>
        )}
      </header>

      <p className="lead">{card.summary}</p>

      {(card.similarities || card.differences) && (
        <div className="grid two">
          {card.similarities && (
            <div className="panel list-panel good">
              <h2>{t('site.similarities')}</h2>
              <ul>{card.similarities.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          {card.differences && (
            <div className="panel list-panel warn">
              <h2>{t('site.differences')}</h2>
              <ul>{card.differences.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div className="grid two">
        <div className="panel">
          <h2>{isEarth ? t('site.matches') : t('site.omanRanked')}</h2>
          <div className="table-wrap flush"><table className="table">
            <tbody>
              {ranked.map((m) => {
                const other = findSite(data, isEarth ? m.target : m.earth)!;
                const earthId = isEarth ? site.id : other.id;
                const targetId = isEarth ? other.id : site.id;
                return (
                  <tr key={other.id}>
                    <td>
                      <span className={`dot ${other.body}`} /> <Link to={`/site/${other.id}`}>{loc(other.name)}</Link>
                    </td>
                    <td className="bar-cell"><ScoreBar value={m.overall} /></td>
                    <td className="muted nowrap">{t('score.confidence')} {num(m.confidence * 100)}%</td>
                    <td><Link className="btn ghost small" to={`/compare?earth=${earthId}&target=${targetId}`}>{t('site.compare')}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>

        {headline && counterpart && (
          <div className="panel">
            <h2>{t('site.profile')} <span className="muted small">{t('site.profileVs', { name: loc(counterpart.name) })}</span></h2>
            <CriteriaRadar criteria={criteria} series={[{ name: loc(counterpart.name), color: BODY_HEX[isEarth ? counterpart.body : site.body], values: headline.per_criterion }]} />
          </div>
        )}
      </div>

      <div className="grid two">
        <div className="panel">
          <h2>{t('site.data')}</h2>
          <div className="table-wrap flush"><table className="table">
            <thead>
              <tr><th>{t('site.criterion')}</th><th>{t('site.datasets')}</th><th>{t('site.resolution')}</th></tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c}>
                  <td>{t(`criteria.${c}`)}</td>
                  <td>{site.sources[c]?.length ? site.sources[c].join(', ') : t('site.none')}</td>
                  <td className="nowrap">{site.resolution_m[c] ? `${num(site.resolution_m[c] as number)} ${t('units.relief_m')}` : t('site.none')}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <div className="panel">
          <h2>
            {t('site.rawMetrics')}{' '}
            <span className={`pill ${site.provisional ? 'warn' : 'ok'}`}>
              {t(!site.provisional ? 'site.measured' : site.measured?.length ? 'site.partial' : 'site.provisional')}
            </span>
          </h2>
          <div className="table-wrap flush"><table className="table">
            <tbody>
              {features.map((f) => {
                const v = site.raw[f];
                const hasValue = v !== null && v !== undefined;
                const isMeasured = site.measured?.includes(f) ?? false;
                return (
                  <tr key={f}>
                    <td>
                      {t(`features.${f}`)}{' '}
                      {hasValue && (
                        <span className={`pill ${isMeasured ? 'ok' : 'warn'}`}>{t(isMeasured ? 'site.tagMeasured' : 'site.tagEstimate')}</span>
                      )}
                    </td>
                    <td className="num-cell">{v === null || v === undefined ? t('site.none') : `${num(v, v < 1 ? 2 : v < 10 ? 1 : 0)} ${t(`units.${f}`)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
