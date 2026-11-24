"""Script to ingest sample Caravan dataset."""

from hydro.ingestion.pipeline import ingest_sample_dataset


def main():
    print("Ingesting sample Caravan catchments...")
    res = ingest_sample_dataset("./data")
    print(f"Successfully ingested {res['catchments_ingested']} catchments into {res['processed_dir']}.")

if __name__ == "__main__":
    main()
