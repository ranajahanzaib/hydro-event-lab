# Contributing to HydroEventLab

We welcome contributions to **HydroEventLab**! As an open-source scientific platform, we value contributions including bug fixes, new hydrological baseflow or metrics algorithms, performance improvements, documentation enhancements, and accessibility audits.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## Development Workflow

### 1. Prerequisites

- **Node.js**: >= 18.x
- **pnpm**: >= 9.x
- **Python**: >= 3.11
- **uv**: >= 0.4.x

### 2. Fork and Clone

Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/<your-username>/hydro-event-lab.git
cd hydro-event-lab
```

### 3. Environment Setup

```bash
# Setup Python virtual environment and install Node dependencies
make setup

# Ingest sample benchmark catchments and build the local analytical database
make rebuild-data
```

### 4. Running Locally

```bash
# Run both the Next.js frontend (port 3000) and FastAPI backend (port 8000)
make dev
```

The web application is accessible at `http://localhost:3000` and API documentation at `http://localhost:8000/docs`.

---

## Scientific & Architectural Guidelines

When contributing code or algorithms, please keep the following non-negotiable scientific boundaries in mind:

1. **Daily Temporal Resolution**:
   - Caravan v1.6 and GRDC-Caravan provide observations aggregated at daily (24-hour) intervals.
   - **Never** infer sub-hourly flash-flood intensity from daily rainfall totals.
   - **Never** report lag times or timings in hours; report response timings strictly in days.
   - Do not apply smoothing that implies higher temporal resolution.
2. **Analytical Transparency**:
   - Estimated baseflow from digital filters (Lyne-Hollick, Eckhardt) must be labeled as filtered quickflow / baseflow estimates, not direct groundwater measurements.
3. **Decoupled Architecture**:
   - Scientific calculations and algorithms belong in `hydro/` and must remain decoupled from HTTP handlers and frontend visualization code.
   - Analytical queries should leverage DuckDB over Parquet files.

---

## Quality Standards

Before submitting a Pull Request, ensure that all linting and automated tests pass:

```bash
# Run all Python scientific and API tests
make test

# Check Python code formatting and linting
make lint

# Run Next.js production build
make build
```

---

## Pull Request Guidelines

1. Create a dedicated branch for your work: `git checkout -b feature/your-feature-name`.
2. Write clear, imperative commit messages.
3. Include unit tests in `tests/` for any new analytical formulas, edge cases, or API endpoints.
4. Ensure documentation in `docs/` is updated if behavior or parameters change.
5. Open a Pull Request referencing any related issues.
