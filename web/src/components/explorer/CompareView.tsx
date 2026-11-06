import { useMemo, useState } from 'react';
import CriteriaRadar from '../charts/CriteriaRadar';
import FeatureBars from '../charts/FeatureBars';
import MetricValue from '../site/MetricValue';
import ScoreBadge, { ScoreBar } from '../similarity/ScoreBadge';
import WeightSliders from '../similarity/WeightSliders';
import { useI18n } from '../../i18n';
import { useDataset } from '../../lib/data';
import { defaultWeights, similarity } from '../../lib/similarity';
import type { Site, Weights } from '../../types';

const EARTH_HEX = '#3fb6a8';
const BODY_HEX = { earth: EARTH_HEX, mars: '#e0703f', moon: '#b8c2d6' } as const;

interface Props {
  earth: Site;
  target: Site;
}

/** Weight sliders, per-criterion scores and raw values for one Oman site and one target (Explorer tab). */
export default function CompareView({ earth, target }: Props) {
  const { t, loc, num } = useI18n();
  const data = useDataset();
  const [weights, setWeights] = useState<Weights>(() => defaultWeights(data.config));

  const result = useMemo(
    () => similarity(earth.raw, target.raw, earth.resolution_m, target.resolution_m, data.config, weights, earth.body, target.body),
    [earth, target, data.config, weights],
  );

  const criteria = Object.keys(data.config.criteria);
  const features = Object.values(data.config.criteria).flatMap((c) => c.features);

  return (
    <div className="compare-view">
      <p className="lead">{t('compare.intro')}</p>

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
                <td><MetricValue site={earth} feature={f} /></td>
                <td><MetricValue site={target} feature={f} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
