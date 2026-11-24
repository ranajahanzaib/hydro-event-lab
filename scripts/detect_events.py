"""Script to run event detection engine over all catchments."""

from hydro.ingestion.pipeline import detect_and_store_all_events


def main():
    print("Running hydrological event detection...")
    res = detect_and_store_all_events("./data/processed")
    print(f"Successfully detected {res['total_events_detected']} events. Stored in {res['events_file']}.")

if __name__ == "__main__":
    main()
