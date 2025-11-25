.PHONY: help up down db logs clean

help:
	@echo "make up    - Start all services"
	@echo "make down  - Stop all services"
	@echo "make db    - Start PostgreSQL only"
	@echo "make logs  - View logs"
	@echo "make clean - Stop and remove volumes"

up:
	docker compose up

down:
	docker compose down

db:
	docker compose up postgres

logs:
	docker compose logs -f

clean:
	docker compose down -v
