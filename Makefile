.PHONY: setup dev test test-hydro test-api ingest-sample ingest-caravan ingest-grdc detect-events build-catalog rebuild-data build lint

PYTHON := .venv/bin/python
UVICORN := .venv/bin/uvicorn
PYTEST := .venv/bin/pytest
RUFF := .venv/bin/ruff

setup:
	uv venv .venv
	uv pip install -e ".[dev]"
	pnpm install

dev:
	pnpm --filter web dev & $(UVICORN) apps.api.main:app --host 0.0.0.0 --port 8000 --reload

dev-api:
	$(UVICORN) apps.api.main:app --host 0.0.0.0 --port 8000 --reload

dev-web:
	pnpm --filter web dev

test: test-hydro test-api

test-hydro:
	$(PYTEST) tests/hydro -v

test-api:
	$(PYTEST) tests/api -v

ingest-sample:
	$(PYTHON) -m scripts.ingest_sample

ingest-caravan:
	$(PYTHON) -m scripts.ingest_caravan

ingest-grdc:
	$(PYTHON) -m scripts.ingest_grdc

detect-events:
	$(PYTHON) -m scripts.detect_events

build-catalog:
	$(PYTHON) -m scripts.build_catalog

rebuild-data: ingest-sample detect-events build-catalog

build:
	pnpm --filter web build

lint:
	$(RUFF) check .
	pnpm --filter web lint
