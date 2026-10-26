export type Body = 'earth' | 'mars' | 'moon';
export type Lang = 'en' | 'ar';

export interface Localized {
  en: string;
  ar: string;
}

export interface SiteCardText {
  summary: string;
  similarities?: string[];
  differences?: string[];
}

export type RawMetrics = Record<string, number | null | undefined>;
export type Resolutions = Record<string, number | null | undefined>;

export interface Site {
  id: string;
  body: Body;
  name: Localized;
  lat: number;
  lon: number;
  bbox_km: number;
  role?: 'analog' | 'reference';
  intended_targets?: string[];
  resolution_m: Resolutions;
  sources: Record<string, string[]>;
  raw: RawMetrics;
  provisional: boolean;
  card: Record<Lang, SiteCardText>;
}

export interface CriterionSpec {
  weight: number;
  features: string[];
}

export interface SimilarityConfig {
  criteria: Record<string, CriterionSpec>;
  feature_ranges: Record<string, [number, number]>;
  common_terrain_scale_m: number;
  confidence: { resolution_k: number; resolution_min_factor: number };
}

export interface SimilarityResult {
  overall: number | null;
  confidence: number;
  coverage: number;
  resolution_factor: number;
  per_criterion: Record<string, number | null>;
}

export interface Score extends SimilarityResult {
  earth: string;
  target: string;
}

export interface Validation {
  reference_site: string | null;
  mean_mars_similarity: Record<string, number | null>;
  ranking: string[];
  reference_rank: number | null;
}

export interface Dataset {
  generated: string;
  provisional: boolean;
  config: SimilarityConfig;
  earth_sites: Site[];
  targets: Site[];
  scores: Score[];
  validation: Validation;
}

export type Weights = Record<string, number>;
