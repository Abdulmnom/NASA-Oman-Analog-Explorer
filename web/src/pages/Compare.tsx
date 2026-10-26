import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CriteriaRadar from '../components/charts/CriteriaRadar';
import FeatureBars from '../components/charts/FeatureBars';
import ScoreBadge, { ScoreBar } from '../components/similarity/ScoreBadge';
import WeightSliders from '../components/similarity/WeightSliders';
import { useI18n } from '../i18n';
import { bestMatch, useDataset } from '../lib/data';
import { defaultWeights, similarity } from '../lib/similarity';
import type { Weights } from '../types';

const EARTH_HEX = '#3fb6a8';
const BODY_HEX = { earth: EARTH_HEX, mars: '#e0703f', moon: '#b8c2d6' } as const;

export default function Compare() {
  const { t, loc, num } = useI18n();
  const data = useDataset();
  const [params, setParams] = useSearchParams();
  const [weights, setWeights] = useState<Weights>(() => defaultWeights(data.config));

  const earth = data.earth_sites.find((s) => s.id === params.get('earth')) ?? data.earth_sites[0];
  const target =
    data.targets.find((s) => s.id === params.get('target')) ??
    data.targets.find((s) => s.id === bestMatch(data, earth)?.target) ??
    data.targets[0];

  const result = useMemo(
    () => similarity(earth.raw, target.raw, earth.resolution_m, target.resolution_m, data.config, weights),
    [earth, target, data.config, weights],
  );

  const setPair = (e: string, tg: string) => setParams({ earth: e, target: tg }, { replace: true });
  const criteria = Object.keys(data.config.criteria);
  const features = Object.values(data.config.criteria).flatMap((c) => c.features);
  const fmt = (v: number | null | undefined, f: string) =>
    v === null || v === undefined ? '—' : `${num(v, v < 1 ? 2 : v < 10 ? 1 : 0)} ${t(`units.${f}`)}`;

  return (
    <div className="page">
      <h1>{t('compare.title')}</h1>
      <p className="lead">{t('compare.intro')}</p>

      <div className="panel toolbar">
        <label className="field">
          <span>{t('compare.earthSite')}</span>
          <select value={earth.id} onChange={(e) => setPair(e.target.value, target.id)}>
            {data.earth_sites.map((s) => <option key={s.id} value={s.id}>{loc(s.name)}</option>)}
          </select>
        </label>
        <span className="vs">↔</span>
        <label className="field">
          <span>{t('compare.target')}</span>
          <select value={target.id} onChange={(e) => setPair(earth.id, e.target.value)}>
            {data.targets.map((s) => <option key={s.id} value={s.id}>{t(`body.${s.body}`)} · {loc(s.name)}</option>)}
          </select>
        </label>
      </div>

      <div className="grid compare-top">
        <div className="panel">
          <h2>{t('compare.weights')}</h2>
          <WeightSliders weights={weights} onChange={setWeights} onReset={() => setWeights(defaultWeights(data.config))} />
        </div>
        <div className="panel result-panel">
          {result.overall === null ? (
            <p className="muted">{t('compare.zeroWeights')}</p>
          ) : (
            <ScoreBadge overall={result.overall} confidence={result.confidence} size="lg" />
          )}
          <dl className="breakdown">
            <div><dt>{t('score.coverage')}</dt><dd>{num(result.coverage * 100)}%</dd></div>
            <div><dt>{t('score.resolution')}</dt><dd>{num(result.resolution_factor * 100)}%</dd></div>
          </dl>
          <p className="muted small">{t('compare.breakdown')}</p>
          {target.body === 'moon' && <p className="note">{t('compare.moonNote')}</p>}
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h2>{t('compare.perCriterion')}</h2>
          <CriteriaRadar criteria={criteria} series={[{ name: loc(target.name), color: BODY_HEX[target.body], values: result.per_criterion }]} />
          <table className="table">
            <tbody>
              {criteria.map((c) => (
                <tr key={c}>
                  <td>{t(`criteria.${c}`)}</td>
                  <td className="bar-cell"><ScoreBar value={result.per_criterion[c]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h2>{t('compare.features')}</h2>
          <FeatureBars config={data.config} a={earth} b={target} colorA={EARTH_HEX} colorB={BODY_HEX[target.body]} />
        </div>
      </div>

      <div className="panel">
        <h2>{t('compare.rawValues')}</h2>
        <table className="table">
          <thead>
            <tr>
              <th>{t('compare.feature')}</th>
              <th><span className="dot earth" /> {loc(earth.name)}</th>
              <th><span className={`dot ${target.body}`} /> {loc(target.name)}</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f}>
                <td>{t(`features.${f}`)}</td>
                <td className="num-cell">{fmt(earth.raw[f], f)}</td>
                <td className="num-cell">{fmt(target.raw[f], f)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
