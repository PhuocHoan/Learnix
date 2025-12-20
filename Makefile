.PHONY: help up down db logs clean build pre e2e

help:
	@echo "make up    - Start all services"
	@echo "make down  - Stop all services"
	@echo "make db    - Start PostgreSQL only"
	@echo "make logs  - View logs"
	@echo "make clean - Stop and remove volumes"
	@echo "make build - Build all services"
	@echo "make pre   - Run pre-commit checks"
	@echo "make e2e   - Run end-to-end tests"

up:
	docker compose up -d

down:
	docker compose down

db:
	docker compose up -d postgres

logs:
	docker compose logs -f

clean:
	docker compose down -v

build:
	pnpm build

pre:
	pnpm precommit

e2e:
	-fuser -k 3000/tcp 5173/tcp 2>/dev/null || true
	pnpm test:e2e
