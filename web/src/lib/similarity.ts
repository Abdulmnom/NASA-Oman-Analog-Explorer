// TypeScript twin of analysis/src/analog/similarity.py + normalize.py.
// Users change weights in the browser, so the index must be computed here too.
// Keep the operation order identical to Python; similarity.test.ts checks parity.

import type { RawMetrics, Resolutions, SimilarityConfig, SimilarityResult, Weights } from '../types';

export function normalizeValue(value: number | null | undefined, range: [number, number]): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const [lo, hi] = range;
  const t = (value - lo) / (hi - lo);
  return Math.min(1, Math.max(0, t));
}

export function resolutionFactor(
  resA: number | null | undefined,
  resB: number | null | undefined,
  k: number,
  minFactor: number,
): number {
  if (!resA || !resB) return 1;
  return Math.max(minFactor, 1 - k * Math.abs(Math.log2(resA / resB)));
}

export function similarity(
  rawA: RawMetrics,
  rawB: RawMetrics,
  resA: Resolutions,
  resB: Resolutions,
  config: SimilarityConfig,
  weights?: Weights | null,
): SimilarityResult {
  const { criteria, feature_ranges: ranges } = config;
  const k = config.confidence.resolution_k;
  const minFactor = config.confidence.resolution_min_factor;

  const perCriterion: Record<string, number | null> = {};
  let num = 0;
  let den = 0;
  let total = 0;
  let resNum = 0;

  for (const [name, spec] of Object.entries(criteria)) {
    const w = weights && name in weights ? Number(weights[name]) : Number(spec.weight);
    if (w > 0) total += w;

    let diffsSum = 0;
    let count = 0;
    for (const feature of spec.features) {
      const na = normalizeValue(rawA[feature], ranges[feature]);
      const nb = normalizeValue(rawB[feature], ranges[feature]);
      if (na === null || nb === null) continue;
      diffsSum += 1 - Math.abs(na - nb);
      count += 1;
    }

    if (count === 0) {
      perCriterion[name] = null;
      continue;
    }

    const score = diffsSum / count;
    perCriterion[name] = score;
    if (w > 0) {
      num += w * score;
      den += w;
      resNum += w * resolutionFactor(resA[name], resB[name], k, minFactor);
    }
  }

  const overall = den > 0 ? num / den : null;
  const coverage = total > 0 ? den / total : 0;
  const resMean = den > 0 ? resNum / den : 0;
  return {
    overall,
    confidence: coverage * resMean,
    coverage,
    resolution_factor: resMean,
    per_criterion: perCriterion,
  };
}

export function defaultWeights(config: SimilarityConfig): Weights {
  return Object.fromEntries(Object.entries(config.criteria).map(([k, v]) => [k, v.weight]));
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 0.7) return 'high';
  if (c >= 0.45) return 'medium';
  return 'low';
}
