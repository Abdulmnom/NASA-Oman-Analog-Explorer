# Methodology

Owner: Abdulrahman · Status: draft v0.1 (weights and ranges to be reviewed with a geologist)

## 1. Principle

Python computes raw metrics once per site; the website reads JSON only. The similarity index is
implemented twice — `analysis/src/analog/similarity.py` and `web/src/lib/similarity.ts` — and
`analysis/tests/test_parity.py` + `web/src/lib/similarity.test.ts` run identical cases through both.

## 2. Criteria and features

Defined in `analysis/config/weights.yaml` (single source of truth).

| Criterion | Weight | Features | Normalisation range |
|---|---|---|---|
| Terrain | 0.4 | mean slope (°), RMS roughness (m, ~1.4 km window, plane-detrended), local relief (m, 5 km window) | 0–30°, 0–150 m, 0–2000 m |
| Mineralogy | 0.4 | serpentine, carbonate, chloride index (0–1) | 0–1 |
| Surface | 0.2 | albedo, thermal inertia (TIU) | 0–0.5, 0–2000 |

Moon targets: terrain only (mineral and surface values are `null`).

## 3. Common spatial scale

Every DEM is block-averaged to **463 m** (MOLA's grid) before computing terrain metrics
(`metrics/terrain.py::resample_block_mean`). Fine grids always look rougher, so comparing 30 m
NASADEM with 463 m MOLA directly would be misleading.

## 4. Formula

```
norm(x)      = clip((x − min) / (max − min), 0, 1)
score_c      = mean over features present on both sides of (1 − |norm_a − norm_b|)
overall      = Σ w_c · score_c / Σ w_c              over criteria with data
coverage     = Σ w_c (with data) / Σ w_c (all, w > 0)
res_factor_c = max(0.5, 1 − 0.1 · |log2(res_a / res_b)|)     native resolutions
confidence   = coverage × (Σ w_c · res_factor_c / Σ w_c)
```

Confidence levels in the UI: high ≥ 0.70, medium ≥ 0.45, low otherwise.

## 5. Mineral indices (`metrics/mineralogy.py`)

* **Band depth** `BD = 1 − R_center / R_continuum`, continuum linear between shoulders.
* Serpentine: 2.32 µm band. Carbonate: requires **both** 2.33 µm and 2.50 µm bands (serpentine
  has no 2.5 µm feature, which separates the two).
* Chloride: bright (R₁.₆ > 0.35), blue SWIR slope (R₂.₂ < R₁.₆), no 2.3 µm absorption.
* Site index = fraction of pixels above a detection threshold (0.02) × mean depth / 0.15 (capped at 1).
  These are proxies, not quantitative abundances.

## 6. Surface (`metrics/surface.py`)

Mars (TES/THEMIS) and Moon (Diviner) publish thermal inertia. For Earth we use apparent thermal
inertia `ATI = (1 − albedo) / (T_day − T_night)` from MODIS, with a linear ATI→TI calibration that
must be fitted on reference pixels (dry sand, bare bedrock) — placeholder coefficients for now.

## 7. Validation

The Dhofar AMADEE-18 site (chosen by experts for a 2018 Mars simulation) is the reference.
`export.py` ranks all Omani sites by mean similarity to Mars targets; the reference should rank near
the top. With provisional values it ranks **2 of 5** (after Sharqiya Sands). Re-check after real data.

## 8. Open questions for the geologist review

1. Are the normalisation ranges sensible for Oman and Mars together?
2. Should mineralogy weigh more than terrain for the Mars comparison?
3. Exact AMADEE-18 field coordinates.
4. Best EMIT scenes over Wadi Tayin and Umm as Samim (cloud-free, low dust).
