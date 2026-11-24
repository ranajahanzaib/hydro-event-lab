# Testing Strategy & Automated Test Suite

HydroEventLab implements unit, integration, and scientific regression test suites.

## Running Tests

```bash
# Run all Python scientific and API tests
make test

# Run scientific engine tests only
make test-hydro

# Run FastAPI endpoint contract tests only
make test-api

# Build Next.js application
make build
```

## Scientific Verification

- Unit conversion consistency ($10\text{ mm/day}$ over $86.4\text{ km}^2 \equiv 10.0\text{ m}^3\text{/s}$).
- Baseflow boundary constraints ($0 \le b(t) \le q(t)$ across Lyne-Hollick and Eckhardt filters).
- Exponential recession regression parameter estimation ($k$, $\tau$, $R^2$).
- Multi-criteria event detection segmentation on benchmark hydrographs.
