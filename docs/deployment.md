# Deployment & Production Configuration

HydroEventLab is packaged as standard containerized microservices ready for Docker Compose or container orchestrators.

## Production Build

```bash
# Build frontend static export or node server
pnpm --filter web build

# Build Docker containers
docker compose build
```

## Docker Compose Deployment

```yaml
version: "3.8"

services:
  api:
    build:
      context: .
      dockerfile: infra/Dockerfile.api
    ports:
      - "8000:8000"
    environment:
      - DATA_DIR=/app/data
      - API_HOST=0.0.0.0
      - API_PORT=8000
    volumes:
      - ./data/processed:/app/data/processed:ro

  web:
    build:
      context: .
      dockerfile: infra/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      - api
```
