import { useI18n } from '../i18n';
import { useDataset } from '../lib/data';
import { DATA_SOURCES } from '../lib/sources';
import type { Body } from '../types';

const FORMULA = `norm(x)      = clip((x − min) / (max − min), 0, 1)
score_c      = mean over shared features of (1 − |norm_a − norm_b|)
overall      = Σ w_c · score_c  /  Σ w_c            (criteria with data)
coverage     = Σ w_c (with data) / Σ w_c (all)
res_factor_c = max(0.5, 1 − 0.1 · |log2(res_a / res_b)|)
confidence   = coverage × weighted mean(res_factor_c)`;

export default function Methodology() {
  const { t, tl, num } = useI18n();
  const data = useDataset();
  const { config, validation } = data;

  const datasetsFor = (criterion: string, body: Body) =>
    DATA_SOURCES.filter((d) => d.criterion === criterion && d.body === body && d.id !== 'DIVINER').map((d) => d.name).join(', ') || '—';

  return (
    <div className="page prose">
      <h1>{t('methodology.title')}</h1>
      <p className="lead">{t('methodology.intro')}</p>

      <h2>{t('methodology.criteriaTitle')}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('methodology.colCriterion')}</th>
              <th>{t('methodology.colFeatures')}</th>
              <th>{t('methodology.colWeight')}</th>
              <th>{t('methodology.colEarth')}</th>
              <th>{t('methodology.colMars')}</th>
              <th>{t('methodology.colMoon')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(config.criteria).map(([name, spec]) => (
              <tr key={name}>
                <td><strong>{t(`criteria.${name}`)}</strong></td>
                <td>
                  {spec.features.map((f) => (
                    <div key={f}>
                      {t(`features.${f}`)} <span className="muted small">[{config.feature_ranges[f].join('–')}{t(`units.${f}`) ? ` ${t(`units.${f}`)}` : ''}]</span>
                    </div>
                  ))}
                </td>
                <td className="num-cell">{num(spec.weight * 100)}%</td>
                <td>{datasetsFor(name, 'earth')}</td>
                <td>{datasetsFor(name, 'mars')}</td>
                <td>{datasetsFor(name, 'moon')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t('methodology.normTitle')}</h2>
      <p>{t('methodology.normText')}</p>

      <h2>{t('methodology.scoreTitle')}</h2>
      <p>{t('methodology.scoreText')}</p>
      <pre className="formula" dir="ltr">{FORMULA}</pre>

      <h2>{t('methodology.confTitle')}</h2>
      <p>{t('methodology.confText')}</p>

      <h2>{t('methodology.scaleTitle')}</h2>
      <p>{t('methodology.scaleText', { scale: config.common_terrain_scale_m })}</p>

      <h2>{t('methodology.validationTitle')}</h2>
      <p>{t('methodology.validationText', { rank: validation.reference_rank ?? '–', total: validation.ranking.length })}</p>

      <h2>{t('methodology.limitsTitle')}</h2>
      <ul>{tl('methodology.limits').map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}
