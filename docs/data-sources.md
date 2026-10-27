# Data sources

Owner: Abdulmunim. We clip a small window around each site (`bbox_km` in the site YAML) and never
download whole scenes. Product keys refer to `analysis/src/analog/download/fetch.py`.

## What is measured today

`python -m analog.compute` (needs `rasterio`) reads only the site window over HTTP, reprojects it to a
local azimuthal-equidistant grid (square metres, also at the lunar pole) and writes
`data/processed/metrics/<id>.json`. No Earthdata login is needed for these sources:

| Metric | Earth | Mars | Moon |
|---|---|---|---|
| Slope, roughness, relief | NASADEM_HGT v001, 30 m (Planetary Computer mirror) | MOLA 463 m global mosaic (USGS) | LOLA LDEM_875S_20M (PDS Geosciences) |
| Albedo | MODIS MCD43A4 v061 NBAR → Liang (2001) broadband, median of 12 monthly composites (2023) | TES Lambert albedo 7.4 km (USGS) | not scored |
| Mineral indices | still provisional (needs EMIT, Earthdata login) | still provisional (needs CRISM) | not scored |
| Thermal inertia | still provisional (ATI calibration pending) | still provisional (THEMIS/TES TI) | not scored |

`export.py` merges these over the provisional values and records, per site, which metrics are
measured (`measured`) and the overall share of real values (`measured_share`).

| Key | Dataset | Body | Criterion | Native res. | Access |
|---|---|---|---|---|---|
| NASADEM | NASADEM_HGT v001 | Earth | Terrain | 30 m | Earthdata (LP DAAC) |
| — | Copernicus DEM GLO-30 | Earth | Terrain (backup) | 30 m | ESA / OpenTopography |
| EMIT | EMITL2ARFL v001 | Earth | Minerals | 60 m | Earthdata (LP DAAC) |
| ASTER | AST_07XT v004 | Earth | Minerals (gap filler) | 15–90 m | Earthdata (LP DAAC) |
| MODIS_ALBEDO | MCD43A3 v061 | Earth | Surface | 500 m | Earthdata (LP DAAC) |
| MODIS_LST | MOD11A1 v061 | Earth | Surface (ATI) | 1 km | Earthdata (LP DAAC) |
| MOLA | MGS MOLA DEM 463 m mosaic | Mars | Terrain | 463 m | USGS Astrogeology (global file, clipped locally) |
| HIRISE_DTM | MRO HiRISE DTM | Mars | Terrain detail | 1 m | PDS ODE |
| CRISM | MRO CRISM TRDR | Mars | Minerals | 18–36 m | PDS ODE |
| THEMIS_TI | Mars Odyssey THEMIS | Mars | Surface / chlorides | 100 m | PDS ODE |
| — | MGS TES | Mars | Surface | ~3 km | ASU / PDS |
| LOLA | LRO LOLA GDR DEM | Moon | Terrain | 5–20 m (polar) | PDS ODE / PGDA |
| DIVINER | LRO Diviner | Moon | Surface (not scored yet) | ~250 m | PDS ODE |

## Coverage checklist (Phase 1 — decision point)

| Site | DEM | Minerals | Surface | Notes |
|---|---|---|---|---|
| samail_ophiolite | ☐ | ☐ EMIT | ☐ | |
| umm_as_samim | ☐ | ☐ EMIT | ☐ | |
| sharqiya_sands | ☐ | ☐ EMIT | ☐ | |
| dhofar_amadee18 | ☐ | ☐ EMIT | ☐ | confirm coordinates |
| jebel_shams | ☐ | n/a | n/a | terrain only vs Moon |
| jezero_crater | ☐ MOLA | ☐ CRISM | ☐ THEMIS | |
| nili_fossae | ☐ MOLA | ☐ CRISM | ☐ THEMIS | |
| terra_sirenum_chlorides | ☐ MOLA | ☐ THEMIS/CRISM | ☐ THEMIS | pick one specific deposit |
| nili_patera_dunes | ☐ MOLA | ☐ CRISM | ☐ THEMIS | |
| moon_south_pole | ☐ LOLA | n/a | n/a | |

Run `python -m analog.download.fetch --all --list-only` to fill this table.

## Base maps (website only)

NASA Solar System Treks WMTS (Viking MDIM 2.1, MOLA shaded relief, LRO WAC, LOLA shaded relief);
Esri World Imagery and OpenTopoMap for Earth.
