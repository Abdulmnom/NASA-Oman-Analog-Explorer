"""Build the JSON the website reads (run once after metrics are computed).

    python -m analog.export

Writes:
  data/processed/sites.json          - canonical output (tracked in git)
  web/public/data/sites.json         - copy served by the frontend
  analysis/tests/fixtures/parity_cases.json - inputs/outputs for the Python<->TS parity test
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from . import ANALYSIS_DIR, CONFIG_DIR, DATA_DIR, REPO_DIR
from .similarity import similarity

METRICS_DIR = DATA_DIR / "processed" / "metrics"
OUT_FILE = DATA_DIR / "processed" / "sites.json"
WEB_FILE = REPO_DIR / "web" / "public" / "data" / "sites.json"
PARITY_FILE = ANALYSIS_DIR / "tests" / "fixtures" / "parity_cases.json"

PARITY_WEIGHT_SETS = [
    None,
    {"terrain": 1.0, "mineralogy": 0.0, "surface": 0.0},
    {"terrain": 0.2, "mineralogy": 0.6, "surface": 0.2},
    {"terrain": 0.0, "mineralogy": 0.0, "surface": 0.0},
]


def load_yaml(name: str) -> Any:
    with open(CONFIG_DIR / name, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_config() -> dict[str, Any]:
    return load_yaml("weights.yaml")


def load_measured(site_id: str) -> dict[str, Any]:
    """Pipeline output from `python -m analog.compute`, or {} if the site has not been run."""
    path = METRICS_DIR / f"{site_id}.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def prepare_sites(raw_sites: list[dict[str, Any]], body: str | None = None) -> list[dict[str, Any]]:
    """Merge measured metrics over provisional ones and record which values are real data.

    A site is `provisional` while any metric it is scored on (non-null provisional value)
    still comes from the placeholder estimates.
    """
    sites = []
    for s in raw_sites:
        estimates = s.get("provisional_metrics", {})
        measured_file = load_measured(s["id"])
        measured = {k: v for k, v in measured_file.get("metrics", {}).items() if v is not None}
        site = {k: v for k, v in s.items() if k != "provisional_metrics"}
        site.setdefault("body", body)
        site["raw"] = {**estimates, **measured}
        site["measured"] = sorted(measured)
        site["provisional"] = any(v is not None and k not in measured for k, v in estimates.items())
        # The pipeline may swap a criterion's dataset (e.g. TES albedo instead of THEMIS).
        site["sources"] = {**site.get("sources", {}), **measured_file.get("sources", {})}
        site["resolution_m"] = {**site.get("resolution_m", {}), **measured_file.get("resolution_m", {})}
        sites.append(site)
    return sites


def score_pairs(earth: list[dict], targets: list[dict], config: dict) -> list[dict[str, Any]]:
    scores = []
    for e in earth:
        for t in targets:
            result = similarity(e["raw"], t["raw"], e["resolution_m"], t["resolution_m"], config)
            scores.append({"earth": e["id"], "target": t["id"], **result})
    return scores


def validation_summary(earth: list[dict], targets: list[dict], scores: list[dict]) -> dict[str, Any]:
    """Does the expert-chosen AMADEE-18 site score well against Mars? (methodology check)"""
    mars_ids = {t["id"] for t in targets if t["body"] == "mars"}
    mean_mars = {}
    for e in earth:
        vals = [s["overall"] for s in scores if s["earth"] == e["id"] and s["target"] in mars_ids and s["overall"] is not None]
        mean_mars[e["id"]] = sum(vals) / len(vals) if vals else None
    ranking = sorted((k for k, v in mean_mars.items() if v is not None), key=lambda k: -mean_mars[k])
    ref = next((e["id"] for e in earth if e.get("role") == "reference"), None)
    return {
        "reference_site": ref,
        "mean_mars_similarity": mean_mars,
        "ranking": ranking,
        "reference_rank": ranking.index(ref) + 1 if ref in ranking else None,
    }


def write_parity_fixtures(earth: list[dict], targets: list[dict], config: dict) -> None:
    cases = []
    for weights in PARITY_WEIGHT_SETS:
        for e in earth:
            for t in targets:
                cases.append({
                    "earth": e["id"],
                    "target": t["id"],
                    "raw_a": e["raw"], "raw_b": t["raw"],
                    "res_a": e["resolution_m"], "res_b": t["resolution_m"],
                    "weights": weights,
                    "expected": similarity(e["raw"], t["raw"], e["resolution_m"], t["resolution_m"], config, weights),
                })
    PARITY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PARITY_FILE, "w", encoding="utf-8") as fh:
        json.dump({"config": config, "cases": cases}, fh, ensure_ascii=False, indent=1)


def measured_share(sites: list[dict[str, Any]]) -> float:
    """Fraction of scored metric values that come from real data rather than estimates."""
    scored = [(s, k) for s in sites for k, v in s["raw"].items() if v is not None]
    return round(sum(k in s["measured"] for s, k in scored) / len(scored), 4) if scored else 0.0


def build() -> dict[str, Any]:
    config = load_config()
    earth = prepare_sites(load_yaml("earth_sites.yaml")["sites"], body="earth")
    targets = prepare_sites(load_yaml("target_sites.yaml")["sites"])
    scores = score_pairs(earth, targets, config)
    return {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "provisional": any(s["provisional"] for s in earth + targets),
        "measured_share": measured_share(earth + targets),
        "config": config,
        "earth_sites": earth,
        "targets": targets,
        "scores": scores,
        "validation": validation_summary(earth, targets, scores),
    }


def main() -> None:
    dataset = build()
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(dataset, fh, ensure_ascii=False, indent=2)
    WEB_FILE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(OUT_FILE, WEB_FILE)
    write_parity_fixtures(dataset["earth_sites"], dataset["targets"], dataset["config"])

    v = dataset["validation"]
    print(f"Wrote {OUT_FILE.relative_to(REPO_DIR)} and {WEB_FILE.relative_to(REPO_DIR)}")
    print(f"{len(dataset['scores'])} pairs scored; measured share: {dataset['measured_share']:.0%}; "
          f"provisional data remaining: {dataset['provisional']}")
    print(f"Validation: reference '{v['reference_site']}' ranks {v['reference_rank']} of {len(v['ranking'])} by mean Mars similarity")


if __name__ == "__main__":
    main()
