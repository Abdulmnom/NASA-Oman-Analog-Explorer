import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { findSite, scoreFor } from '../../lib/data';
import type { Dataset, Site } from '../../types';

const layerUrl = (id: string) => `${import.meta.env.BASE_URL}layers/${id}/elevation.png`;

interface Pair {
  earth: Site;
  target: Site;
}

/** Earth sites paired with their best-scoring intended Mars target (Mars targets all have terrain layers). */
function marsPairs(data: Dataset): Pair[] {
  return data.earth_sites.flatMap((earth) => {
    const target = (earth.intended_targets ?? [])
      .map((id) => findSite(data, id))
      .filter((s): s is Site => !!s && s.body === 'mars')
      .sort((a, b) => (scoreFor(data, earth.id, b.id)?.overall ?? -1) - (scoreFor(data, earth.id, a.id)?.overall ?? -1))[0];
    return target ? [{ earth, target }] : [];
  });
}

/** Window size (km) of a terrain layer, read from its meta.json; null until loaded or if missing. */
function useWindowKm(id: string): number | null {
  const [km, setKm] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    setKm(null);
    if (!id) return;
    fetch(`${import.meta.env.BASE_URL}layers/${id}/meta.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((m: { half_km?: number }) => alive && setKm(typeof m.half_km === 'number' ? m.half_km * 2 : null))
      .catch(() => alive && setKm(null));
    return () => {
      alive = false;
    };
  }, [id]);
  return km;
}

/** Before/after slider: an Omani site and its Mars counterpart in the same shaded-relief style. */
export default function TwinSlider({ data }: { data: Dataset }) {
  const { t, loc, num } = useI18n();
  const pairs = marsPairs(data);
  const [index, setIndex] = useState(0);
  const [split, setSplit] = useState(50);
  const pair = pairs[Math.min(index, pairs.length - 1)];
  const earthKm = useWindowKm(pair?.earth.id ?? '');
  const marsKm = useWindowKm(pair?.target.id ?? '');
  if (!pair) return null;
  const score = scoreFor(data, pair.earth.id, pair.target.id);

  return (
    <section className="twin" aria-labelledby="twin-title">
      <div className="section-head">
        <h2 id="twin-title">{t('home.twinTitle')}</h2>
        <p className="muted">{t('home.twinSubtitle')}</p>
      </div>

      <div className="twin-tabs" role="tablist">
        {pairs.map((p, i) => (
          <button
            key={p.earth.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`twin-tab${i === index ? ' active' : ''}`}
            onClick={() => {
              setIndex(i);
              setSplit(50);
            }}
          >
            <span className="dot earth" /> {loc(p.earth.name)}
            <span className="twin-arrow" aria-hidden="true">↔</span>
            <span className="dot mars" /> {loc(p.target.name)}
          </button>
        ))}
      </div>

      <div className="twin-stage" dir="ltr" style={{ '--split': `${split}%` } as CSSProperties}>
        <img className="twin-img" src={layerUrl(pair.target.id)} alt={loc(pair.target.name)} draggable={false} />
        <img className="twin-img twin-top" src={layerUrl(pair.earth.id)} alt={loc(pair.earth.name)} draggable={false} />
        <span className="twin-label earth">
          <span className="dot earth" /> {loc(pair.earth.name)}
          {earthKm !== null && <small>{t('home.twinWindow', { n: num(earthKm) })}</small>}
        </span>
        <span className="twin-label mars">
          <span className="dot mars" /> {loc(pair.target.name)}
          {marsKm !== null && <small>{t('home.twinWindow', { n: num(marsKm) })}</small>}
        </span>
        <span className="twin-handle" aria-hidden="true">
          <span>‹ ›</span>
        </span>
        <input
          className="twin-range"
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label={t('home.twinHandle')}
        />
      </div>

      <div className="twin-foot">
        <p className="muted small">{t('home.twinCredit')}</p>
        <div className="twin-actions">
          {score?.overall != null && <span className="twin-score">{t('home.twinScore', { v: num(score.overall * 100) })}</span>}
          <Link to={`/explorer?site=${pair.earth.id}&target=${pair.target.id}`} className="btn ghost small">
            {t('home.twinOpen')}
          </Link>
        </div>
      </div>
    </section>
  );
}
