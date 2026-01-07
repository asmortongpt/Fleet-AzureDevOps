# Fleet Management System - Makefile
# Production-grade automation for build, test, security, and deployment

.PHONY: help install build test review finish deploy clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)Fleet Management System$(NC)"
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation

install: ## Install all dependencies (root + orchestrator)
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	cd tools/orchestrator && npm install
	cd tools/remediator && npm install
	cd tools/gates && npm install
	cd tools/repo_sync && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

install-tools: ## Install security scanning tools (semgrep, trivy, gitleaks)
	@echo "$(BLUE)Installing security tools...$(NC)"
	@command -v semgrep >/dev/null 2>&1 || (echo "Installing semgrep..." && pip3 install semgrep)
	@command -v trivy >/dev/null 2>&1 || (echo "Installing trivy..." && brew install trivy)
	@command -v gitleaks >/dev/null 2>&1 || (echo "Installing gitleaks..." && brew install gitleaks)
	@echo "$(GREEN)✓ Security tools installed$(NC)"

##@ Build

build: ## Build the application
	@echo "$(BLUE)Building application...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

build-orchestrator: ## Build the orchestrator
	@echo "$(BLUE)Building orchestrator...$(NC)"
	cd tools/orchestrator && npm run build
	@echo "$(GREEN)✓ Orchestrator built$(NC)"

build-all: build build-orchestrator ## Build application and orchestrator

##@ Testing

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	npm run test:unit
	npm run test:e2e
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

##@ Security & Quality

review: build-orchestrator ## Run security review (all scanners + reports)
	@echo "$(BLUE)Running security review...$(NC)"
	cd tools/orchestrator && npm run review
	@echo "$(GREEN)✓ Review complete. Check tools/orchestrator/artifacts/$(NC)"

finish: build-orchestrator ## Autonomous remediation until gates pass
	@echo "$(YELLOW)⚠ Starting autonomous remediation...$(NC)"
	cd tools/orchestrator && npm run finish
	@echo "$(GREEN)✓ Remediation complete$(NC)"

scan-semgrep: ## Run Semgrep SAST scan
	@echo "$(BLUE)Running Semgrep...$(NC)"
	semgrep --config=p/security-audit --config=p/typescript --json --output=semgrep-results.json .
	@echo "$(GREEN)✓ Semgrep complete$(NC)"

scan-trivy: ## Run Trivy vulnerability scan
	@echo "$(BLUE)Running Trivy...$(NC)"
	trivy fs --format json --output trivy-results.json .
	@echo "$(GREEN)✓ Trivy complete$(NC)"

scan-gitleaks: ## Run Gitleaks secret detection
	@echo "$(BLUE)Running Gitleaks...$(NC)"
	gitleaks detect --no-git --report-format json --report-path gitleaks-results.json
	@echo "$(GREEN)✓ Gitleaks complete$(NC)"

lint: ## Run ESLint
	@echo "$(BLUE)Running ESLint...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Lint complete$(NC)"

lint-fix: ## Run ESLint with auto-fix
	@echo "$(BLUE)Running ESLint with auto-fix...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✓ Lint fixes applied$(NC)"

typecheck: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type check...$(NC)"
	npm run typecheck:all
	@echo "$(GREEN)✓ Type check complete$(NC)"

##@ Development

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	npm run dev

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist
	rm -rf build
	rm -rf coverage
	rm -rf node_modules/.cache
	rm -rf tools/orchestrator/dist
	rm -rf tools/orchestrator/artifacts
	@echo "$(GREEN)✓ Clean complete$(NC)"

##@ Deployment

deploy-staging: build ## Deploy to staging
	@echo "$(BLUE)Deploying to staging...$(NC)"
	@echo "$(YELLOW)Not implemented yet$(NC)"

deploy-prod: review build ## Deploy to production (requires review)
	@echo "$(BLUE)Deploying to production...$(NC)"
	@echo "$(YELLOW)Not implemented yet$(NC)"

##@ Git Operations

sync-repos: ## Sync to GitHub and Azure DevOps
	@echo "$(BLUE)Syncing repositories...$(NC)"
	git pull origin main
	git push origin main
	@echo "$(GREEN)✓ Repositories synced$(NC)"

commit: ## Create a git commit with staged changes
	@echo "$(BLUE)Creating commit...$(NC)"
	git status
	@read -p "Enter commit message: " message; \
	git commit -m "$$message"
	@echo "$(GREEN)✓ Commit created$(NC)"

##@ CI/CD

ci-check: lint typecheck test ## Run all CI checks
	@echo "$(GREEN)✓ All CI checks passed$(NC)"

pre-commit: lint-fix typecheck ## Pre-commit hook
	@echo "$(GREEN)✓ Pre-commit checks passed$(NC)"
