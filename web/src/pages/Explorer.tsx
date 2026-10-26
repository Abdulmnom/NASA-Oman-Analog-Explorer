import { Link, useSearchParams } from 'react-router-dom';
import TwinMaps from '../components/map/TwinMaps';
import ScoreBadge, { ScoreBar } from '../components/similarity/ScoreBadge';
import { useI18n } from '../i18n';
import { bestMatch, findSite, matchesFor, scoreFor, useDataset } from '../lib/data';

export default function Explorer() {
  const { t, loc, lang } = useI18n();
  const data = useDataset();
  const [params, setParams] = useSearchParams();

  const earth = data.earth_sites.find((s) => s.id === params.get('site')) ?? data.earth_sites[0];
  const matches = matchesFor(data, earth.id);
  const target =
    data.targets.find((s) => s.id === params.get('target')) ?? findSite(data, bestMatch(data, earth)?.target) ?? data.targets[0];
  const score = scoreFor(data, earth.id, target.id);

  const select = (site: string, tgt?: string) => {
    const next = new URLSearchParams({ site });
    if (tgt) next.set('target', tgt);
    setParams(next, { replace: true });
  };

  return (
    <div className="page wide">
      <h1>{t('explorer.title')}</h1>
      <p className="lead">{t('explorer.intro')}</p>

      <div className="explorer">
        <aside className="panel site-list">
          <h2 className="small-title">{t('explorer.pickSite')}</h2>
          <ul>
            {data.earth_sites.map((s) => {
              const best = bestMatch(data, s);
              return (
                <li key={s.id}>
                  <button type="button" className={s.id === earth.id ? 'active' : ''} onClick={() => select(s.id)}>
                    <span className="name">{loc(s.name)}</span>
                    {s.role === 'reference' ? (
                      <span className="pill ref">{t('explorer.reference')}</span>
                    ) : (
                      best && <ScoreBar value={best.overall} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="explorer-main">
          <div className="panel toolbar">
            <label className="field">
              <span>{t('explorer.target')}</span>
              <select value={target.id} onChange={(e) => select(earth.id, e.target.value)}>
                {matches.map((m) => {
                  const s = findSite(data, m.target)!;
                  const intended = earth.intended_targets?.includes(s.id);
                  return (
                    <option key={s.id} value={s.id}>
                      {t(`body.${s.body}`)} · {loc(s.name)} — {m.overall === null ? '–' : Math.round(m.overall * 100)}%
                      {intended ? ` ★ ${t('explorer.intended')}` : ''}
                    </option>
                  );
                })}
              </select>
            </label>
            {score && <ScoreBadge overall={score.overall} confidence={score.confidence} />}
            <div className="toolbar-links">
              <Link className="btn ghost small" to={`/site/${earth.id}`}>{t('explorer.openDetails')}</Link>
              <Link className="btn primary small" to={`/compare?earth=${earth.id}&target=${target.id}`}>{t('explorer.openCompare')}</Link>
            </div>
          </div>

          <TwinMaps
            earthSites={data.earth_sites}
            earth={earth}
            targets={data.targets}
            target={target}
            onSelectEarth={(id) => select(id)}
            onSelectTarget={(id) => select(earth.id, id)}
          />

          <div className="grid two">
            <div className="panel">
              <h3><span className="dot earth" /> {loc(earth.name)}</h3>
              <p>{earth.card[lang].summary}</p>
            </div>
            <div className="panel">
              <h3><span className={`dot ${target.body}`} /> {loc(target.name)}</h3>
              <p>{target.card[lang].summary}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
