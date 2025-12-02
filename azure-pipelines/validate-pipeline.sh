#!/bin/bash

# ============================================================================
# Azure Pipeline YAML Validation Script
# ============================================================================
# This script validates the Azure Pipelines YAML files for syntax errors
# and common issues before pushing to Azure DevOps.
#
# Usage: ./validate-pipeline.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
SUCCESS=0

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Azure Pipeline YAML Validation${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to check if file exists
check_file() {
    local file=$1
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ File not found: $file${NC}"
        ((ERRORS++))
        return 1
    fi
    return 0
}

# Function to validate YAML syntax
validate_yaml() {
    local file=$1
    echo -e "${BLUE}Checking: $file${NC}"

    # Check if file exists
    if ! check_file "$file"; then
        return 1
    fi

    # Check for basic YAML syntax (indentation, structure)
    if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        echo -e "${RED}✗ Invalid YAML syntax in: $file${NC}"
        python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>&1 | head -5
        ((ERRORS++))
        return 1
    fi

    # Check for common issues
    local issues=0

    # Check for tabs (should use spaces)
    if grep -q $'\t' "$file"; then
        echo -e "${YELLOW}⚠ Warning: Tabs found in $file (use spaces)${NC}"
        ((WARNINGS++))
        ((issues++))
    fi

    # Check for trailing whitespace
    if grep -q ' $' "$file"; then
        echo -e "${YELLOW}⚠ Warning: Trailing whitespace found in $file${NC}"
        ((WARNINGS++))
        ((issues++))
    fi

    # Check for required keywords in main pipeline
    if [[ "$file" == *"azure-pipelines.yml" ]]; then
        if ! grep -q "trigger:" "$file"; then
            echo -e "${YELLOW}⚠ Warning: No trigger defined in $file${NC}"
            ((WARNINGS++))
            ((issues++))
        fi

        if ! grep -q "stages:" "$file"; then
            echo -e "${RED}✗ Error: No stages defined in $file${NC}"
            ((ERRORS++))
            return 1
        fi
    fi

    # Check for required keywords in templates
    if [[ "$file" == *"template"* ]]; then
        if ! grep -q "jobs:" "$file"; then
            echo -e "${RED}✗ Error: No jobs defined in template $file${NC}"
            ((ERRORS++))
            return 1
        fi

        if ! grep -q "steps:" "$file"; then
            echo -e "${RED}✗ Error: No steps defined in template $file${NC}"
            ((ERRORS++))
            return 1
        fi
    fi

    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✓ Valid YAML: $file${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠ Valid YAML with warnings: $file${NC}"
        ((SUCCESS++))
    fi

    echo ""
    return 0
}

# Function to check for required service connections
check_service_connections() {
    echo -e "${BLUE}Checking service connections...${NC}"

    local main_file="azure-pipelines.yml"
    local required_connections=("fleet-acr-connection" "fleet-azure-subscription" "fleet-aks-connection")

    for conn in "${required_connections[@]}"; do
        if grep -r "$conn" azure-pipelines/ >/dev/null; then
            echo -e "${GREEN}✓ Found reference to: $conn${NC}"
        else
            echo -e "${YELLOW}⚠ No reference to service connection: $conn${NC}"
            ((WARNINGS++))
        fi
    done
    echo ""
}

# Function to check for required variable groups
check_variable_groups() {
    echo -e "${BLUE}Checking variable groups...${NC}"

    local main_file="azure-pipelines.yml"

    if grep -q "fleet-production-vars" "$main_file"; then
        echo -e "${GREEN}✓ Found variable group: fleet-production-vars${NC}"
    else
        echo -e "${RED}✗ Missing variable group: fleet-production-vars${NC}"
        ((ERRORS++))
    fi

    if grep -q "fleet-secrets" "$main_file"; then
        echo -e "${GREEN}✓ Found variable group: fleet-secrets${NC}"
    else
        echo -e "${RED}✗ Missing variable group: fleet-secrets${NC}"
        ((ERRORS++))
    fi
    echo ""
}

# Function to check template references
check_template_references() {
    echo -e "${BLUE}Checking template references...${NC}"

    local main_file="azure-pipelines.yml"
    local templates=(
        "lint-template.yml"
        "test-template.yml"
        "build-template.yml"
        "docker-template.yml"
        "security-template.yml"
        "deploy-template.yml"
        "smoke-test-template.yml"
        "rollback-template.yml"
    )

    for template in "${templates[@]}"; do
        if grep -q "$template" "$main_file"; then
            if [ -f "azure-pipelines/templates/$template" ]; then
                echo -e "${GREEN}✓ Template referenced and exists: $template${NC}"
            else
                echo -e "${RED}✗ Template referenced but missing: $template${NC}"
                ((ERRORS++))
            fi
        else
            echo -e "${YELLOW}⚠ Template not referenced in main pipeline: $template${NC}"
            ((WARNINGS++))
        fi
    done
    echo ""
}

# Function to check for required variables
check_required_variables() {
    echo -e "${BLUE}Checking required variables...${NC}"

    local main_file="azure-pipelines.yml"
    local required_vars=(
        "nodeVersion"
        "registryName"
        "registryLoginServer"
        "aksCluster"
        "aksResourceGroup"
        "namespace"
        "productionUrl"
    )

    for var in "${required_vars[@]}"; do
        if grep -q "$var" "$main_file"; then
            echo -e "${GREEN}✓ Variable defined: $var${NC}"
        else
            echo -e "${RED}✗ Missing required variable: $var${NC}"
            ((ERRORS++))
        fi
    done
    echo ""
}

# Function to check Dockerfile references
check_dockerfile_references() {
    echo -e "${BLUE}Checking Dockerfile references...${NC}"

    local docker_template="azure-pipelines/templates/docker-template.yml"

    # Check API Dockerfile
    if grep -q "api/Dockerfile.production" "$docker_template"; then
        if [ -f "api/Dockerfile.production" ]; then
            echo -e "${GREEN}✓ API Dockerfile exists: api/Dockerfile.production${NC}"
        else
            echo -e "${RED}✗ API Dockerfile missing: api/Dockerfile.production${NC}"
            ((ERRORS++))
        fi
    fi

    # Check Frontend Dockerfile
    if grep -q "Dockerfile\"" "$docker_template"; then
        if [ -f "Dockerfile" ]; then
            echo -e "${GREEN}✓ Frontend Dockerfile exists: Dockerfile${NC}"
        else
            echo -e "${RED}✗ Frontend Dockerfile missing: Dockerfile${NC}"
            ((ERRORS++))
        fi
    fi
    echo ""
}

# Main validation flow
echo -e "${BLUE}Step 1: Validating main pipeline file${NC}"
echo -e "${BLUE}------------------------------------${NC}"
validate_yaml "azure-pipelines.yml"

echo -e "${BLUE}Step 2: Validating template files${NC}"
echo -e "${BLUE}------------------------------------${NC}"
for template in azure-pipelines/templates/*.yml; do
    if [ -f "$template" ]; then
        validate_yaml "$template"
    fi
done

echo -e "${BLUE}Step 3: Checking service connections${NC}"
echo -e "${BLUE}------------------------------------${NC}"
check_service_connections

echo -e "${BLUE}Step 4: Checking variable groups${NC}"
echo -e "${BLUE}------------------------------------${NC}"
check_variable_groups

echo -e "${BLUE}Step 5: Checking template references${NC}"
echo -e "${BLUE}------------------------------------${NC}"
check_template_references

echo -e "${BLUE}Step 6: Checking required variables${NC}"
echo -e "${BLUE}------------------------------------${NC}"
check_required_variables

echo -e "${BLUE}Step 7: Checking Dockerfile references${NC}"
echo -e "${BLUE}------------------------------------${NC}"
check_dockerfile_references

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ Successful checks: $SUCCESS${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "${RED}✗ Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All validation checks passed!${NC}"
    echo -e "${GREEN}✓ Pipeline is ready to be pushed to Azure DevOps${NC}"
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s)${NC}"
    echo -e "${RED}✗ Please fix the errors before pushing to Azure DevOps${NC}"
    exit 1
fi
