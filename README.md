# Oman Analog Explorer

**NASA Space Apps Challenge 2026 — Ibra**
Challenge: *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*

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

> **Status:** the pipeline, website and tests are complete. Metric values in
> `analysis/config/*_sites.yaml` are **provisional estimates** (flagged in the UI) until Phase 1–2
> downloads real data. Dropping `data/processed/metrics/<site_id>.json` files in place makes the
> export use measured values automatically.

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

Earth products need a free [NASA Earthdata Login](https://urs.earthdata.nasa.gov/).
Mars/Moon products are searched through the PDS ODE REST API (no login).
**Decision point:** if EMIT or CRISM do not cover a site, change the site before more UI work.

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
3. **البيانات الحقيقية:** بعد إنشاء حساب NASA Earthdata شغّل `python -m analog.download.fetch --all --list-only` لفحص التغطية (المرحلة 1). القيم الحالية في ملفات YAML **تقديرات مؤقتة** وتظهر كذلك في الموقع.
