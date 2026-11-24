# Development Guide

## Prerequisites

- Node.js >= 18.x
- pnpm >= 9.x
- Python >= 3.11
- uv >= 0.4.x

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/ranajahanzaib/hydro-event-lab.git
cd hydro-event-lab

# Setup environment, python dependencies, and node packages
make setup

# Ingest benchmark catchments, detect events, and build catalog
make rebuild-data
```

## Running Development Servers

```bash
# Start frontend (port 3000) and API (port 8000) simultaneously
make dev

# Or run separately:
make dev-api   # FastAPI at http://localhost:8000
make dev-web   # Next.js at http://localhost:3000
```
