"""Compute measured metrics from real NASA data and write data/processed/metrics/<id>.json.

    python -m analog.compute                 # every site
    python -m analog.compute --site jezero_crater

Only the window around each site is read (HTTP range requests), never whole scenes:
  Earth terrain  NASADEM_HGT v001 (30 m)         Microsoft Planetary Computer mirror, no login
  Earth albedo   MODIS MCD43A4 v061 NBAR (500 m)  Planetary Computer, 12 monthly composites
  Mars terrain   MGS MOLA global DEM (463 m)      USGS Astrogeology
  Mars albedo    MGS TES albedo (7.4 km)          USGS Astrogeology
  Moon terrain   LRO LOLA polar DEM 87.5S (20 m)  PDS Geosciences Node

Mineral indices (EMIT, CRISM) and thermal inertia are not computed here yet; export.py keeps
their provisional values and marks the site as partly provisional.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
from datetime import datetime, timezone
from typing import Any

import numpy as np

from .download.sites import BODY_RADIUS_KM, load_sites
from .export import METRICS_DIR, load_config
from .metrics.terrain import terrain_metrics

PC_API = "https://planetarycomputer.microsoft.com/api"
MOLA_URL = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
TES_ALBEDO_URL = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars_MGS_TES_Albedo_mosaic_global_7410m.tif"
LOLA_SOUTH_URL = ("https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/"
                  "polar/float_img/ldem_875s_20m_float.lbl")

GDAL_ENV = {"GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR", "GDAL_HTTP_MAX_RETRY": "4", "GDAL_HTTP_RETRY_DELAY": "2"}

# Liang (2001) narrow-to-broadband shortwave albedo for MODIS bands 1-5 and 7.
LIANG_MODIS = {1: 0.160, 2: 0.291, 3: 0.243, 4: 0.116, 5: 0.112, 7: 0.081}
LIANG_OFFSET = -0.0015


def liang_albedo(bands: dict[int, np.ndarray]) -> np.ndarray:
    """Broadband shortwave albedo from MODIS reflectances (Liang 2001)."""
    return sum(coef * bands[b] for b, coef in LIANG_MODIS.items()) + LIANG_OFFSET


# ---------- HTTP / STAC helpers ----------

def _json(url: str, body: dict | None = None) -> Any:
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.load(resp)


def pc_search(collection: str, bbox: tuple[float, float, float, float], datetime_range: str | None = None,
              limit: int = 20) -> list[dict]:
    body: dict[str, Any] = {"collections": [collection], "bbox": list(bbox), "limit": limit}
    if datetime_range:
        body["datetime"] = datetime_range
    return _json(f"{PC_API}/stac/v1/search", body)["features"]


_TOKENS: dict[str, str] = {}


def pc_signed(href: str) -> str:
    """Append a read-only SAS token for the blob container (anonymous, no account needed)."""
    account = href.split("//")[1].split(".")[0]
    container = href.split(".net/")[1].split("/")[0]
    key = f"{account}/{container}"
    if key not in _TOKENS:
        _TOKENS[key] = _json(f"{PC_API}/sas/v1/token/{key}")["token"]
    return f"{href}?{_TOKENS[key]}"


# ---------- local metric grid ----------

def local_grid(lat: float, lon: float, half_km: float, body: str, res_m: float):
    """Azimuthal equidistant grid centred on the site, so pixels are square metres everywhere
    (including the lunar pole, where lat/lon grids collapse)."""
    from rasterio.crs import CRS
    from rasterio.transform import from_origin

    if body == "earth":
        crs = CRS.from_proj4(f"+proj=aeqd +lat_0={lat} +lon_0={lon} +datum=WGS84 +units=m +no_defs")
    else:
        radius = BODY_RADIUS_KM[body] * 1000
        crs = CRS.from_proj4(f"+proj=aeqd +lat_0={lat} +lon_0={lon} +R={radius} +units=m +no_defs")
    half = half_km * 1000
    n = int(round(2 * half / res_m))
    return crs, from_origin(-half, half, res_m, res_m), (n, n)


def warp_into(dst: np.ndarray, src_path: str, dst_crs, dst_transform, band: int = 1,
              scale: float = 1.0, valid_max: float | None = None) -> None:
    """Reproject one band of a (remote) raster into `dst`, keeping cells already filled."""
    import rasterio
    from rasterio.warp import Resampling, reproject

    with rasterio.Env(**GDAL_ENV), rasterio.open(src_path) as src:
        tmp = np.full(dst.shape, np.nan, dtype="float64")
        reproject(
            source=rasterio.band(src, band), destination=tmp,
            src_nodata=src.nodata, dst_nodata=np.nan,
            dst_transform=dst_transform, dst_crs=dst_crs, resampling=Resampling.bilinear,
        )
    tmp *= scale
    if valid_max is not None:
        tmp[tmp > valid_max] = np.nan
    fill = np.isnan(dst) & np.isfinite(tmp)
    dst[fill] = tmp[fill]


def _finite_median(a: np.ndarray) -> float:
    f = a[np.isfinite(a)]
    return float(np.median(f)) if f.size else float("nan")


# ---------- per-body sources ----------

def _bbox_deg(lat: float, lon: float, half_km: float) -> tuple[float, float, float, float]:
    from .download.sites import bbox_for
    return bbox_for(lat, lon, half_km, "earth").as_tuple()


def earth_dem(site: dict, res_m: float) -> tuple[np.ndarray, dict]:
    crs, transform, shape = local_grid(site["lat"], site["lon"], site["bbox_km"], "earth", res_m)
    dem = np.full(shape, np.nan)
    items = pc_search("nasadem", _bbox_deg(site["lat"], site["lon"], site["bbox_km"]))
    for item in items:
        warp_into(dem, f"/vsicurl/{pc_signed(item['assets']['elevation']['href'])}", crs, transform)
    return dem, {"dataset": "NASADEM_HGT v001", "tiles": [i["id"] for i in items]}


def mars_dem(site: dict, res_m: float) -> tuple[np.ndarray, dict]:
    crs, transform, shape = local_grid(site["lat"], site["lon"], site["bbox_km"], "mars", res_m)
    dem = np.full(shape, np.nan)
    warp_into(dem, f"/vsicurl/{MOLA_URL}", crs, transform)
    return dem, {"dataset": "MGS MOLA DEM 463 m global mosaic"}


def moon_dem(site: dict, res_m: float) -> tuple[np.ndarray, dict]:
    if site["lat"] > -87.5:
        raise ValueError("Only the LOLA 87.5S polar tile is wired up; add another tile for this latitude.")
    crs, transform, shape = local_grid(site["lat"], site["lon"], site["bbox_km"], "moon", res_m)
    dem = np.full(shape, np.nan)
    warp_into(dem, f"/vsicurl/{LOLA_SOUTH_URL}", crs, transform, scale=1000.0)  # heights are in km
    return dem, {"dataset": "LRO LOLA LDEM_875S_20M"}


def earth_albedo(site: dict, year: int = 2023) -> tuple[float, dict]:
    """Median of 12 monthly MODIS NBAR composites -> one broadband albedo per site."""
    crs, transform, shape = local_grid(site["lat"], site["lon"], site["bbox_km"], "earth", 500)
    bbox = _bbox_deg(site["lat"], site["lon"], site["bbox_km"])
    monthly, used = [], []
    for month in range(1, 13):
        items = pc_search("modis-43A4-061", bbox, f"{year}-{month:02d}-10/{year}-{month:02d}-20", limit=1)
        if not items:
            continue
        item = items[0]
        bands = {}
        for b in LIANG_MODIS:
            arr = np.full(shape, np.nan)
            href = item["assets"][f"Nadir_Reflectance_Band{b}"]["href"]
            warp_into(arr, f"/vsicurl/{pc_signed(href)}", crs, transform, scale=1e-4, valid_max=1.0)
            bands[b] = arr
        value = _finite_median(liang_albedo(bands))
        if np.isfinite(value):
            monthly.append(value)
            used.append(item["id"])
    return float(np.median(monthly)), {"dataset": "MODIS MCD43A4 v061 NBAR, Liang (2001) broadband",
                                       "granules": used}


def mars_albedo(site: dict) -> tuple[float, dict]:
    crs, transform, shape = local_grid(site["lat"], site["lon"], site["bbox_km"], "mars", 1000)
    arr = np.full(shape, np.nan)
    warp_into(arr, f"/vsicurl/{TES_ALBEDO_URL}", crs, transform, valid_max=1.0)
    return _finite_median(arr), {"dataset": "MGS TES Lambert albedo 7.4 km global mosaic"}


DEM_SOURCES = {"earth": (earth_dem, 30.0), "mars": (mars_dem, 463.0), "moon": (moon_dem, 20.0)}


def compute_site(site: dict, common_res_m: float) -> dict[str, Any]:
    body = site["body"]
    dem_fn, native_res = DEM_SOURCES[body]
    dem, dem_info = dem_fn(site, native_res)
    coverage = float(np.isfinite(dem).mean())
    if coverage < 0.9:
        raise RuntimeError(f"{site['id']}: DEM covers only {coverage:.0%} of the window")
    metrics: dict[str, float] = terrain_metrics(dem, native_res, common_res_m)
    datasets = {"terrain": dem_info}

    if body == "earth":
        metrics["albedo"], datasets["albedo"] = earth_albedo(site)
    elif body == "mars":
        metrics["albedo"], datasets["albedo"] = mars_albedo(site)

    out: dict[str, Any] = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "metrics": {k: round(v, 4) for k, v in metrics.items()},
        "datasets": datasets,
        "dem_coverage": round(coverage, 4),
    }
    out["sources"] = {"terrain": {"earth": ["NASADEM"], "mars": ["MOLA"], "moon": ["LOLA"]}[body]}
    if body == "mars":
        # Surface criterion now mixes TES albedo (7.4 km) with provisional thermal inertia.
        out["sources"]["surface"] = ["TES albedo"]
        out["resolution_m"] = {"surface": 7410}
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", help="one site id (default: all)")
    args = parser.parse_args()

    common = load_config()["common_terrain_scale_m"]
    sites = load_sites()
    ids = [args.site] if args.site else list(sites)
    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    failed = []
    for sid in ids:
        try:
            result = compute_site(sites[sid], common)
        except Exception as exc:  # keep going; a failed site stays provisional
            print(f"[{sid}] FAILED: {exc}")
            failed.append(sid)
            continue
        with open(METRICS_DIR / f"{sid}.json", "w", encoding="utf-8") as fh:
            json.dump(result, fh, ensure_ascii=False, indent=2)
        print(f"[{sid}] {result['metrics']}")
    if failed:
        raise SystemExit(f"Failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
