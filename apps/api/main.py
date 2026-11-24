"""HydroEventLab - FastAPI Application Entrypoint."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from apps.api.routers import analysis, catchments, events, exports, system
from hydro.ingestion.pipeline import (
    build_catalog_manifest,
    detect_and_store_all_events,
    ingest_sample_dataset,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure processed data exists on startup
    data_dir = Path(os.environ.get("DATA_DIR", "./data"))
    processed_dir = data_dir / "processed"
    events_file = processed_dir / "events.parquet"

    if not events_file.exists():
        print("[Startup] Initializing benchmark Caravan dataset and detecting events...")
        ingest_sample_dataset(data_dir)
        detect_and_store_all_events(processed_dir)
        build_catalog_manifest(processed_dir)
        print("[Startup] Initialization complete.")
    yield


app = FastAPI(
    title="HydroEventLab API",
    description="Scientific research platform for investigating global rainfall-runoff catchment responses.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Next.js frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Register versioned API routers
api_v1_prefix = "/api/v1"
app.include_router(system.router, prefix=api_v1_prefix)
app.include_router(catchments.router, prefix=api_v1_prefix)
app.include_router(events.router, prefix=api_v1_prefix)
app.include_router(analysis.router, prefix=api_v1_prefix)
app.include_router(exports.router, prefix=api_v1_prefix)


@app.get("/")
def root():
    return {
        "product": "HydroEventLab",
        "tagline": "Every catchment responds differently.",
        "api_docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
