# Oman Analog Explorer

**NASA Space Apps Challenge 2026 — Ibra**
Challenge: *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*

**Live site:** https://nasa-oman-analog-explorer.vercel.app · mirror: https://abdulmnom.github.io/NASA-Oman-Analog-Explorer/

An interactive website that compares Omani field sites with Mars landing regions (primary) and the
lunar south pole (secondary, terrain only), using NASA data and an open, adjustable similarity index.
Every score comes with a confidence value and every site card lists differences and data limits —
we never claim a site is "just like Mars".

| Oman site | Compared with | Why |
|---|---|---|
| Samail Ophiolite (Wadi Tayin) | Jezero Crater / Nili Fossae | serpentine + carbonate |
| Umm as Samim sabkha | Terra Sirenum chloride deposits | salts in a hyper-arid basin |
| Sharqiya (Wahiba) Sands | Nili Patera dune field | dune form |
| Dhofar desert (AMADEE-18) | — (all Mars targets) | reference site used to validate the index |
| Jebel Shams / Wadi Ghul | Lunar south pole (Shackleton rim) | slopes & relief only |

## VEX Scout: screen a whole country before sending a team

Field surveys of analog sites are expensive: every candidate needs a trip. **VEX Scout** (`/#/scout`) screens
all of Oman first, from free data, and lets anyone fly a virtual drone over the real terrain of any part of it.

1. **Screen.** Oman is split into **449 cells of 0.25° (about 27 km)**; a cell is kept when at least 30 % of it
   is land inside Oman's border (Natural Earth 1:10m). For every cell, NASADEM (30 m) is averaged to the same
   463 m scale as the site analysis, and slope, roughness and relief are compared with each Mars and Moon
   target using the **same code and normalisation** as the site scores (terrain only). The map shows how
   Mars-like or Moon-like each part of Oman is.
2. **Second opinion (AI).** A k-nearest-neighbour model learned from Earth places that space agencies and analog
   programmes already chose (the Atlas benchmarks, plus AMADEE-18 for Mars). It rates each cell on terrain and
   NASA POWER climate (aridity, dry air, day-night swing) and explains which features fit and which do not.
3. **Fly.** Pick a cell and a virtual drone flies over its real NASADEM terrain, with satellite imagery,
   a slope safety view (< 10° safe, 10–25° caution, > 25° hazard), a Jezero-style hazard map, land cover,
   and Mars colours. Autopilot survey, photos, KML route export and a **Dragonfly mode** that copies the
   leapfrog plan of NASA's Dragonfly rotorcraft for Titan.
4. **Decide.** A 2 km scan returns **GO / CONDITIONAL / NO-GO** from four checks: science match (top 15 % pass,
   top 50 % caution), safe ground (≥ 40 % pass, ≥ 15 % caution), human footprint from ESA WorldCover 10 m
   (< 1 % pass, < 5 % caution) and distance from Muscat (≤ 450 km pass). Any failure is NO-GO; any caution
   is CONDITIONAL.

**Cross-check:** the screening never used our site choices, yet the cell around Jebel Shams ranks **#4 of 449**
for the Moon, the same answer as the full site analysis.

**Honest limits:** the drone is virtual and the screening uses terrain only, so Scout narrows the search; a
field visit still confirms the result. Code: `analysis/src/analog/grid.py`, `grid_layers.py`,
`grid_buildings.py`, `scout_ai.py`; web: `web/src/pages/Scout.tsx`, `web/src/components/scout/`.

## How it works

```
NASA data ──► analysis/ (Python) ──► data/processed/sites.json ──► web/ (React, static)
               metrics + index          small JSON, in git          reads JSON only
```

* Python computes raw metrics **once** per site and writes JSON — no server, no database.
* The similarity formula exists in **both** Python (`analysis/src/analog/similarity.py`) and
  TypeScript (`web/src/lib/similarity.ts`) because users change weights in the browser.
  A parity test runs the same cases through both and fails if they ever differ.
* Terrain is compared on a **common 463 m grid** — mixing 30 m and 463 m data directly is misleading.

> **Status:** every metric value comes from a named NASA dataset via `python -m analog.compute`
> and carries its provenance (dataset, version, product IDs, dates). No values are written by hand.
> Values that cannot be computed yet are `null` with a reason in English and Arabic (for example
> Dhofar has no cloud-free EMIT pixels; chloride and Earth thermal inertia have no cited calibration). See `docs/data-sources.md`.

## Quick start

### 1 · Analysis (Python ≥ 3.11)

```bash
cd analysis
python -m venv .venv
.venv/Scripts/activate            # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python -m analog.export           # (from analysis/, with src on PYTHONPATH — see below)
pytest
```

`python -m analog.export` needs `src/` on the path: either `pip install -e .` once, or run
`PYTHONPATH=src python -m analog.export` (PowerShell: `$env:PYTHONPATH="src"; python -m analog.export`).

### 2 · Website (Node ≥ 20)

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # Python <-> TypeScript parity test
npm run build      # static site in web/dist
```

### 3 · Real data (Phase 1)

```bash
pip install -e ".[download]"      # earthaccess, rasterio, xarray
python -m analog.download.fetch --all --list-only          # coverage check for every site
python -m analog.download.fetch --site samail_ophiolite --product EMIT
```

Earth products need a free [NASA Earthdata Login](https://urs.earthdata.nasa.gov/). Put an Earthdata
user token in the git-ignored `.env.local` at the repo root as `EARTHDATA_TOKEN=...` (the older name
`ETHINA_LOGIN` also works); `analog.compute` passes it to earthaccess.
Mars/Moon products are searched through the PDS ODE REST API (no login).
**Decision point:** if EMIT or CRISM do not cover a site, change the site before more UI work.

### 4 · Terrain map layers (DEM, slope, drainage)

```bash
python -m analog.layers           # all Earth + Mars sites -> web/public/layers/<site>/
```

Reads the same NASADEM (30 m) and MOLA (463 m) DEMs as the scores, over a wider context window, and
writes elevation (hypsometric tint + hillshade), slope classes, and topographic drainage
(Priority-Flood fill + D8 flow accumulation) as PNG overlays plus a `meta.json` with the legend values.
Drainage shows where water *would* flow on today's surface, not where water is. No layers for the Moon.

### 5 · Field environment (NASA POWER, context only)

```bash
python -m analog.environment      # data/processed/environment/nasa_power/*.json -> web/public/data/environment.json
```

The six raw NASA POWER Climatology API answers (v2.10.1, Jan 2001 – Dec 2025, community RE) are kept
unchanged in `data/processed/environment/nasa_power/`; each output entry carries its exact request URL.
The script only adds rain per year (PRECTOTCORR × 365) and the coolest three-month window. These values
appear on site pages, in the Analog Atlas and in the mission plan. They are **not** part of the score:
there is no matching Mars climate source in the pipeline yet, and a POWER grid cell (0.5°–1°, roughly 50–100 km) is much
coarser than the analysis windows.

## Repository layout

```
oman-analog-explorer/
├── docs/              methodology.md · data-sources.md · sites.md
├── analysis/          Python — runs once, outputs JSON
│   ├── config/        earth_sites.yaml · target_sites.yaml · weights.yaml
│   ├── src/analog/    download/ · metrics/ (terrain, mineralogy, surface) · normalize · similarity · export
│   ├── notebooks/
│   └── tests/         incl. fixtures/parity_cases.json
├── data/
│   ├── raw/           not in git (large)
│   └── processed/     sites.json + metrics/ (small, in git)
├── web/               React + TypeScript + Vite
│   ├── public/data/   copy of sites.json
│   └── src/           pages/ · components/{map,charts,site,similarity}/ · lib/similarity.ts · i18n/{en,ar}.json · types/
└── presentation/      slides, video script, images
```

## Deploy

* **Vercel (live site):** `vercel.json` builds `web/`; `main` deploys to https://nasa-oman-analog-explorer.vercel.app and every branch gets a preview URL.

* **GitHub Pages:** `.github/workflows/deploy.yml` builds `web/` and publishes on every push to `main`
  (enable *Settings → Pages → Source: GitHub Actions*).
* **Firebase:** `cd web && npm run build && firebase deploy` (`firebase.json` points at `web/dist`).

## Team

| | Role |
|---|---|
| Abdulmunim | Data & analysis, project manager |
| Saeed | Frontend |
| Abdulrahman | Methodology & integration |
| Narjis | Story & presentation |

---

## بالعربية — البدء السريع

1. **التحليل:** داخل مجلد `analysis` أنشئ بيئة Python وثبّت المتطلبات، ثم شغّل `python -m analog.export` لإنتاج `data/processed/sites.json` ونسخه إلى الواجهة، ثم `pytest`.
2. **الواجهة:** داخل مجلد `web` شغّل `npm install` ثم `npm run dev` وافتح `http://localhost:5173`. الأمر `npm test` يتأكد أن معادلة TypeScript تعطي نفس نتائج Python.
3. **البيانات الحقيقية:** شغّل `python -m analog.compute` لحساب المقاييس من بيانات ناسا مع توثيق مصدر كل قيمة، ثم `python -m analog.export`. لا توجد أي قيم مكتوبة يدوياً؛ القيمة التي لا يمكن حسابها تظهر "غير متاحة" مع السبب. قراءة EMIT تحتاج رمز NASA Earthdata في ملف `.env.local` باسم `EARTHDATA_TOKEN` (أو `ETHINA_LOGIN`).
4. **طبقات التضاريس:** شغّل `python -m analog.layers` لإنتاج خرائط الارتفاع والانحدار والتصريف لمواقع عُمان والمريخ في `web/public/layers`.
