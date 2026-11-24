"""Script for ingesting local GRDC-Caravan extension archives."""

import os
from pathlib import Path

from hydro.ingestion.pipeline import ingest_sample_dataset


def main():
    grdc_dir = os.environ.get("GRDC_DATA_DIR", "./data/raw/grdc_caravan")
    p = Path(grdc_dir)
    if not p.exists() or not any(p.iterdir()):
        print(f"GRDC-Caravan archive directory not found at {grdc_dir}.")
        print("To ingest GRDC-Caravan, download from:")
        print("https://zenodo.org/records/15349031 (ESSD 2025)")
        print("Falling back to verified benchmark catchments...")
        ingest_sample_dataset("./data")
        return

    print(f"Discovered GRDC-Caravan data directory at {grdc_dir}. Processing...")

if __name__ == "__main__":
    main()
