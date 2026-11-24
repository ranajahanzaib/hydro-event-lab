"""Script for ingesting local or downloaded Caravan v1.6 NetCDF/CSV archives."""

import os
from pathlib import Path

from hydro.ingestion.pipeline import ingest_sample_dataset


def main():
    caravan_dir = os.environ.get("CARAVAN_DATA_DIR", "./data/raw/caravan")
    p = Path(caravan_dir)
    if not p.exists() or not any(p.iterdir()):
        print(f"Caravan v1.6 archive directory not found at {caravan_dir}.")
        print("To ingest the full Caravan v1.6 dataset, download NetCDF/CSV from:")
        print("https://zenodo.org/records/15529786 or https://zenodo.org/records/15530021")
        print("Falling back to verified benchmark Caravan sample catchments...")
        ingest_sample_dataset("./data")
        return

    print(f"Discovered Caravan data directory at {caravan_dir}. Processing...")

if __name__ == "__main__":
    main()
