import { useI18n } from '../../i18n';
import type { Weights } from '../../types';

interface Props {
  weights: Weights;
  onChange: (w: Weights) => void;
  onReset: () => void;
}

export default function WeightSliders({ weights, onChange, onReset }: Props) {
  const { t, num } = useI18n();
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return (
    <div className="weights">
      {Object.entries(weights).map(([name, w]) => (
        <label key={name} className="weight-row">
          <span className="weight-name">{t(`criteria.${name}`)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={w}
            onChange={(e) => onChange({ ...weights, [name]: Number(e.target.value) })}
          />
          <span className="weight-val">{total > 0 ? `${num((w / total) * 100)}%` : '0%'}</span>
        </label>
      ))}
      <button type="button" className="btn ghost small" onClick={onReset}>
        {t('compare.reset')}
      </button>
    </div>
  );
}
