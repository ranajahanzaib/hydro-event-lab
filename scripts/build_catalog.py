"""Script to build catalog manifest."""

from hydro.ingestion.pipeline import build_catalog_manifest


def main():
    print("Building dataset catalog manifest...")
    manifest = build_catalog_manifest("./data/processed")
    print(f"Catalog built with {manifest['indexed_catchments']} catchments and {manifest['indexed_events']} events.")

if __name__ == "__main__":
    main()
