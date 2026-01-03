.PHONY: help build up down logs clean test install-cli verify demo

# Default target
help:
	@echo "Autonomous Development Platform - Makefile Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make install-cli    - Install autodev CLI globally"
	@echo ""
	@echo "Development:"
	@echo "  make logs           - View all service logs"
	@echo "  make logs-svc SVC=orchestrator - View specific service logs"
	@echo "  make shell-svc SVC=orchestrator - Shell into service"
	@echo "  make restart-svc SVC=orchestrator - Restart specific service"
	@echo ""
	@echo "Operations:"
	@echo "  make test           - Run platform verification tests"
	@echo "  make demo           - Run demo app rebuild"
	@echo "  make verify         - Run all quality gates"
	@echo "  make clean          - Remove all containers and volumes"
	@echo "  make reset          - Complete reset (clean + rebuild)"
	@echo ""
	@echo "Monitoring:"
	@echo "  make status         - Show service status"
	@echo "  make flower         - Open Celery Flower UI"
	@echo "  make db-shell       - PostgreSQL shell"
	@echo ""

# Build all images
build:
	@echo "Building all Docker images..."
	docker-compose build --parallel

# Start all services
up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@echo "Services started. Access:"
	@echo "  Orchestrator API: http://localhost:8000"
	@echo "  Flower (Celery):  http://localhost:5555"
	@echo "  PostgreSQL:       localhost:5432"

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down

# View all logs
logs:
	docker-compose logs -f

# View specific service logs
logs-svc:
	@if [ -z "$(SVC)" ]; then echo "Usage: make logs-svc SVC=<service-name>"; exit 1; fi
	docker-compose logs -f $(SVC)

# Shell into specific service
shell-svc:
	@if [ -z "$(SVC)" ]; then echo "Usage: make shell-svc SVC=<service-name>"; exit 1; fi
	docker-compose exec $(SVC) /bin/bash

# Restart specific service
restart-svc:
	@if [ -z "$(SVC)" ]; then echo "Usage: make restart-svc SVC=<service-name>"; exit 1; fi
	docker-compose restart $(SVC)

# Show service status
status:
	@echo "Service Status:"
	@docker-compose ps

# Install CLI globally
install-cli:
	@echo "Installing autodev CLI..."
	cd cli && pip install -e .
	@echo "CLI installed. Run 'autodev --help' to verify."

# PostgreSQL shell
db-shell:
	docker-compose exec postgres psql -U autodev -d autodev

# Redis CLI
redis-cli:
	docker-compose exec redis redis-cli

# Open Flower UI
flower:
	@echo "Opening Flower UI at http://localhost:5555"
	@open http://localhost:5555 || xdg-open http://localhost:5555 || echo "Visit http://localhost:5555"

# Run platform verification tests
test:
	@echo "Running platform verification tests..."
	docker-compose exec orchestrator python -m pytest tests/ -v

# Run demo app
demo:
	@echo "Running demo app rebuild..."
	autodev rebuild --repo ./examples/demo_app --target production

# Verify platform
verify:
	@echo "Running all quality gates..."
	@echo "[1/5] Testing MCP servers..."
	@curl -f http://localhost:8001/health || echo "repo_tools failed"
	@curl -f http://localhost:8002/health || echo "test_tools failed"
	@curl -f http://localhost:8003/health || echo "browser_tools failed"
	@curl -f http://localhost:8004/health || echo "security_tools failed"
	@curl -f http://localhost:8005/health || echo "devops_tools failed"
	@echo "[2/5] Testing orchestrator..."
	@curl -f http://localhost:8000/health || echo "orchestrator failed"
	@echo "[3/5] Testing database..."
	@docker-compose exec -T postgres pg_isready -U autodev || echo "postgres failed"
	@echo "[4/5] Testing Redis..."
	@docker-compose exec -T redis redis-cli ping || echo "redis failed"
	@echo "[5/5] Testing Celery..."
	@docker-compose exec -T celery-worker celery -A tasks inspect ping || echo "celery failed"
	@echo "Verification complete!"

# Clean everything
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v
	@echo "Removing workspace data..."
	rm -rf workspace_data/

# Complete reset
reset: clean
	@echo "Rebuilding from scratch..."
	@$(MAKE) build
	@$(MAKE) up

# Development mode (with logs)
dev:
	docker-compose up --build

# Production mode (detached)
prod:
	docker-compose up -d --build --scale celery-worker=4

# Backup database
backup-db:
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U autodev autodev > backups/autodev-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "Database backed up to backups/"

# Restore database
restore-db:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore-db FILE=<backup-file>"; exit 1; fi
	docker-compose exec -T postgres psql -U autodev -d autodev < $(FILE)

# Check resource usage
stats:
	docker stats --no-stream

# Tail all logs
tail:
	docker-compose logs --tail=100 -f

# Export environment template
env-template:
	@echo "Creating .env.template..."
	@echo "POSTGRES_PASSWORD=autodev_secure_pass" > .env.template
	@echo "ANTHROPIC_API_KEY=your_key_here" >> .env.template
	@echo "OPENAI_API_KEY=your_key_here" >> .env.template
	@echo "AZURE_DEVOPS_PAT=your_pat_here" >> .env.template
	@echo "Template created: .env.template"
