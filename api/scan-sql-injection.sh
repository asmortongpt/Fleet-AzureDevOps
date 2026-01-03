#!/bin/bash

echo "=========================================="
echo "SQL Injection Vulnerability Scanner"
echo "=========================================="
echo ""

echo "1. INTERVAL Injection Vulnerabilities:"
echo "--------------------------------------"
grep -rn "INTERVAL '\${" src/ --include="*.ts" | grep -v "\.test\.ts" | wc -l
echo "files found"

echo ""
echo "2. Template Literal SQL Queries (potential vulnerabilities):"
echo "--------------------------------------------------------------"
grep -rn '\.query.*`' src/ --include="*.ts" | grep -v "\.test\.ts" | wc -l
echo "instances found"

echo ""
echo "3. Files with INTERVAL vulnerabilities:"
echo "----------------------------------------"
grep -rn "INTERVAL '\${" src/ --include="*.ts" | grep -v "\.test\.ts" | cut -d: -f1 | sort -u

echo ""
echo "4. Detailed INTERVAL vulnerabilities:"
echo "--------------------------------------"
grep -rn "INTERVAL '\${" src/ --include="*.ts" | grep -v "\.test\.ts"

echo ""
echo "=========================================="
echo "Scan Complete"
echo "=========================================="
