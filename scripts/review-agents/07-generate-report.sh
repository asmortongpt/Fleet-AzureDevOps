#!/bin/bash

################################################################################
# Generate Comprehensive Review Report
# Aggregates findings from all agents into a detailed markdown report
################################################################################

set -e

OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
REPO_DIR="${REPO_DIR:-$(pwd)}"
REPORT_FILE="${FINAL_REPORT:-$REPO_DIR/COMPREHENSIVE_REVIEW_REPORT.md}"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1"; }

log_info "Generating comprehensive review report..."

################################################################################
# Aggregate Data from All Agents
################################################################################

TOTAL_CRITICAL=0
TOTAL_HIGH=0
TOTAL_MEDIUM=0
TOTAL_LOW=0
TOTAL_INFO=0
TOTAL_REMEDIATION=0

# Collect all findings
CRITICAL_FINDINGS=()
HIGH_FINDINGS=()
MEDIUM_FINDINGS=()
LOW_FINDINGS=()

for report in "$OUTPUT_DIR"/0*-report.json; do
  if [ -f "$report" ]; then
    AGENT_NAME=$(jq -r '.agent' "$report")

    # Count issues
    CRITICAL=$(jq '.summary.criticalCount // 0' "$report")
    HIGH=$(jq '.summary.highCount // 0' "$report")
    MEDIUM=$(jq '.summary.mediumCount // 0' "$report")
    LOW=$(jq '.summary.lowCount // 0' "$report")
    INFO=$(jq '.summary.infoCount // 0' "$report")

    TOTAL_CRITICAL=$((TOTAL_CRITICAL + CRITICAL))
    TOTAL_HIGH=$((TOTAL_HIGH + HIGH))
    TOTAL_MEDIUM=$((TOTAL_MEDIUM + MEDIUM))
    TOTAL_LOW=$((TOTAL_LOW + LOW))
    TOTAL_INFO=$((TOTAL_INFO + INFO))

    # Extract findings
    CRITICAL_JSON=$(jq -c --arg agent "$AGENT_NAME" '.findings.critical[] | . + {agent: $agent}' "$report" 2>/dev/null)
    while IFS= read -r finding; do
      [ -n "$finding" ] && CRITICAL_FINDINGS+=("$finding")
    done <<< "$CRITICAL_JSON"

    HIGH_JSON=$(jq -c --arg agent "$AGENT_NAME" '.findings.high[] | . + {agent: $agent}' "$report" 2>/dev/null)
    while IFS= read -r finding; do
      [ -n "$finding" ] && HIGH_FINDINGS+=("$finding")
    done <<< "$HIGH_JSON"

    MEDIUM_JSON=$(jq -c --arg agent "$AGENT_NAME" '.findings.medium[] | . + {agent: $agent}' "$report" 2>/dev/null)
    while IFS= read -r finding; do
      [ -n "$finding" ] && MEDIUM_FINDINGS+=("$finding")
    done <<< "$MEDIUM_JSON"

    LOW_JSON=$(jq -c --arg agent "$AGENT_NAME" '.findings.low[] | . + {agent: $agent}' "$report" 2>/dev/null)
    while IFS= read -r finding; do
      [ -n "$finding" ] && LOW_FINDINGS+=("$finding")
    done <<< "$LOW_JSON"

    # Sum remediation time
    REMEDIATION=$(jq -r '.remediationTime // "0 hours"' "$report" | sed 's/[^0-9]*//g')
    TOTAL_REMEDIATION=$((TOTAL_REMEDIATION + REMEDIATION))
  fi
done

TOTAL_ISSUES=$((TOTAL_CRITICAL + TOTAL_HIGH + TOTAL_MEDIUM + TOTAL_LOW + TOTAL_INFO))

################################################################################
# Generate Markdown Report
################################################################################

cat > "$REPORT_FILE" <<HEADER
# Fleet Management System - Comprehensive Code Review Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Repository:** $REPO_DIR
**Review Type:** Automated Multi-Agent Analysis

---

## Executive Summary

This comprehensive code review was performed by 5 autonomous specialized agents analyzing security, performance, code quality, architecture, and compliance aspects of the Fleet Management System.

### Overall Assessment

| Metric | Count |
|--------|-------|
| **Total Issues** | $TOTAL_ISSUES |
| **Critical Issues** | $TOTAL_CRITICAL |
| **High Priority Issues** | $TOTAL_HIGH |
| **Medium Priority Issues** | $TOTAL_MEDIUM |
| **Low Priority Issues** | $TOTAL_LOW |
| **Informational** | $TOTAL_INFO |
| **Estimated Remediation Time** | $TOTAL_REMEDIATION hours |

### Risk Level

HEADER

# Determine overall risk level
if [ $TOTAL_CRITICAL -gt 0 ]; then
  echo "**🔴 HIGH RISK** - Critical issues require immediate attention" >> "$REPORT_FILE"
elif [ $TOTAL_HIGH -gt 5 ]; then
  echo "**🟠 MODERATE RISK** - Multiple high priority issues detected" >> "$REPORT_FILE"
elif [ $TOTAL_HIGH -gt 0 ]; then
  echo "**🟡 LOW-MODERATE RISK** - Some high priority issues detected" >> "$REPORT_FILE"
else
  echo "**🟢 LOW RISK** - No critical or high priority issues detected" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<AGENTS

### Agent Summary

| Agent | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
AGENTS

# Add agent summaries
for report in "$OUTPUT_DIR"/0*-report.json; do
  if [ -f "$report" ]; then
    AGENT_NAME=$(jq -r '.agent' "$report")
    C=$(jq '.summary.criticalCount // 0' "$report")
    H=$(jq '.summary.highCount // 0' "$report")
    M=$(jq '.summary.mediumCount // 0' "$report")
    L=$(jq '.summary.lowCount // 0' "$report")
    T=$(jq '.summary.totalIssues // 0' "$report")
    echo "| $AGENT_NAME | $C | $H | $M | $L | $T |" >> "$REPORT_FILE"
  fi
done

cat >> "$REPORT_FILE" <<FINDINGS

---

## Critical Issues (Priority 1)

**These issues pose immediate security risks or severely impact application functionality. Address ASAP.**

FINDINGS

# Add critical findings
if [ ${#CRITICAL_FINDINGS[@]} -eq 0 ]; then
  echo "✅ No critical issues found." >> "$REPORT_FILE"
else
  ISSUE_NUM=1
  for finding in "${CRITICAL_FINDINGS[@]}"; do
    TITLE=$(echo "$finding" | jq -r '.title')
    DESC=$(echo "$finding" | jq -r '.description')
    REMEDIATION=$(echo "$finding" | jq -r '.remediation')
    EFFORT=$(echo "$finding" | jq -r '.effort // "N/A"')
    FILE=$(echo "$finding" | jq -r '.file // "N/A"')
    CATEGORY=$(echo "$finding" | jq -r '.category // "general"')
    AGENT=$(echo "$finding" | jq -r '.agent // "Unknown"')
    CODE_EXAMPLE=$(echo "$finding" | jq -r '.codeExample // ""')

    cat >> "$REPORT_FILE" <<ISSUE

### $ISSUE_NUM. $TITLE

**Category:** $CATEGORY
**Agent:** $AGENT
**File(s):** \`$FILE\`
**Effort:** $EFFORT

**Description:**
$DESC

**Remediation:**
$REMEDIATION

ISSUE

    if [ -n "$CODE_EXAMPLE" ] && [ "$CODE_EXAMPLE" != "null" ]; then
      cat >> "$REPORT_FILE" <<CODEBLOCK

**Code Example:**
\`\`\`typescript
$CODE_EXAMPLE
\`\`\`

CODEBLOCK
    fi

    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    ISSUE_NUM=$((ISSUE_NUM + 1))
  done
fi

cat >> "$REPORT_FILE" <<HIGH

## High Priority Issues (Priority 2)

**These issues should be addressed in the near term to improve security and maintainability.**

HIGH

# Add high findings
if [ ${#HIGH_FINDINGS[@]} -eq 0 ]; then
  echo "✅ No high priority issues found." >> "$REPORT_FILE"
else
  ISSUE_NUM=1
  for finding in "${HIGH_FINDINGS[@]}"; do
    TITLE=$(echo "$finding" | jq -r '.title')
    DESC=$(echo "$finding" | jq -r '.description')
    REMEDIATION=$(echo "$finding" | jq -r '.remediation')
    EFFORT=$(echo "$finding" | jq -r '.effort // "N/A"')
    FILE=$(echo "$finding" | jq -r '.file // "N/A"')
    CATEGORY=$(echo "$finding" | jq -r '.category // "general"')
    AGENT=$(echo "$finding" | jq -r '.agent // "Unknown"')
    CODE_EXAMPLE=$(echo "$finding" | jq -r '.codeExample // ""')

    cat >> "$REPORT_FILE" <<ISSUE

### $ISSUE_NUM. $TITLE

**Category:** $CATEGORY
**Agent:** $AGENT
**File(s):** \`$FILE\`
**Effort:** $EFFORT

**Description:**
$DESC

**Remediation:**
$REMEDIATION

ISSUE

    if [ -n "$CODE_EXAMPLE" ] && [ "$CODE_EXAMPLE" != "null" ]; then
      cat >> "$REPORT_FILE" <<CODEBLOCK

**Code Example:**
\`\`\`typescript
$CODE_EXAMPLE
\`\`\`

CODEBLOCK
    fi

    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    ISSUE_NUM=$((ISSUE_NUM + 1))
  done
fi

cat >> "$REPORT_FILE" <<MEDIUM

## Medium Priority Issues (Priority 3)

**These issues should be addressed to improve code quality and performance.**

MEDIUM

# Add medium findings (limited to top 10)
if [ ${#MEDIUM_FINDINGS[@]} -eq 0 ]; then
  echo "✅ No medium priority issues found." >> "$REPORT_FILE"
else
  ISSUE_NUM=1
  for finding in "${MEDIUM_FINDINGS[@]:0:10}"; do
    TITLE=$(echo "$finding" | jq -r '.title')
    DESC=$(echo "$finding" | jq -r '.description')
    REMEDIATION=$(echo "$finding" | jq -r '.remediation')
    EFFORT=$(echo "$finding" | jq -r '.effort // "N/A"')
    CATEGORY=$(echo "$finding" | jq -r '.category // "general"')
    AGENT=$(echo "$finding" | jq -r '.agent // "Unknown"')

    cat >> "$REPORT_FILE" <<ISSUE

### $ISSUE_NUM. $TITLE

**Category:** $CATEGORY | **Agent:** $AGENT | **Effort:** $EFFORT

$DESC

**Remediation:** $REMEDIATION

---

ISSUE
    ISSUE_NUM=$((ISSUE_NUM + 1))
  done

  if [ ${#MEDIUM_FINDINGS[@]} -gt 10 ]; then
    REMAINING=$((${#MEDIUM_FINDINGS[@]} - 10))
    echo "*... and $REMAINING more medium priority issues. See individual agent reports for details.*" >> "$REPORT_FILE"
  fi
fi

cat >> "$REPORT_FILE" <<LOW

## Low Priority Issues (Priority 4)

**These are minor issues and code smells that can be addressed over time.**

LOW

# Add low findings summary only
if [ ${#LOW_FINDINGS[@]} -eq 0 ]; then
  echo "✅ No low priority issues found." >> "$REPORT_FILE"
else
  echo "Found ${#LOW_FINDINGS[@]} low priority issues:" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  # Group by category
  declare -A LOW_CATEGORIES
  for finding in "${LOW_FINDINGS[@]}"; do
    CATEGORY=$(echo "$finding" | jq -r '.category // "general"')
    TITLE=$(echo "$finding" | jq -r '.title')
    LOW_CATEGORIES[$CATEGORY]+="- $TITLE\n"
  done

  for category in "${!LOW_CATEGORIES[@]}"; do
    echo "**$category:**" >> "$REPORT_FILE"
    echo -e "${LOW_CATEGORIES[$category]}" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  done

  echo "*See individual agent reports for detailed remediation steps.*" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<TIMELINE

---

## Remediation Timeline

Based on estimated effort, here's a suggested remediation timeline:

### Phase 1: Critical & High Priority (Weeks 1-2)
**Estimated Effort:** $(($(echo "${CRITICAL_FINDINGS[@]}" | jq -r '.effort // "0"' | sed 's/[^0-9]*//g' | awk '{sum+=$1} END {print sum}') + $(echo "${HIGH_FINDINGS[@]:0:5}" | jq -r '.effort // "0"' | sed 's/[^0-9]*//g' | awk '{sum+=$1} END {print sum}'))) hours

- Address all critical security issues
- Fix critical FedRAMP compliance gaps
- Resolve high priority security vulnerabilities
- Implement missing security controls

### Phase 2: Remaining High Priority (Weeks 3-4)
**Estimated Effort:** ~40-60 hours

- Complete remaining high priority issues
- Performance optimizations
- Architecture improvements

### Phase 3: Medium Priority (Weeks 5-8)
**Estimated Effort:** ~60-80 hours

- Code quality improvements
- Documentation enhancements
- Refactoring for maintainability

### Phase 4: Low Priority (Ongoing)
**Estimated Effort:** ~40-60 hours

- Code smells cleanup
- Minor optimizations
- Technical debt reduction

---

## Detailed Agent Reports

For complete details on each finding, refer to the individual agent reports:

1. **Security Audit Report:** \`$OUTPUT_DIR/01-security-audit-report.json\`
   - Vulnerability scanning, secrets detection, OWASP Top 10 analysis

2. **Performance Report:** \`$OUTPUT_DIR/02-performance-report.json\`
   - Bundle analysis, Lighthouse scores, database optimization

3. **Code Quality Report:** \`$OUTPUT_DIR/03-code-quality-report.json\`
   - Complexity metrics, test coverage, code duplication

4. **Architecture Report:** \`$OUTPUT_DIR/04-architecture-report.json\`
   - Dependency analysis, circular dependencies, design patterns

5. **Compliance Report:** \`$OUTPUT_DIR/05-compliance-report.json\`
   - WCAG accessibility, GDPR compliance, FedRAMP requirements

---

## Recommendations

### Immediate Actions (This Week)

TIMELINE

# Add top 3 critical/high recommendations
RECO_NUM=1
for finding in "${CRITICAL_FINDINGS[@]:0:3}"; do
  TITLE=$(echo "$finding" | jq -r '.title')
  REMEDIATION=$(echo "$finding" | jq -r '.remediation')
  echo "$RECO_NUM. **$TITLE:** $REMEDIATION" >> "$REPORT_FILE"
  RECO_NUM=$((RECO_NUM + 1))
done

for finding in "${HIGH_FINDINGS[@]:0:$((3 - ${#CRITICAL_FINDINGS[@]}))}" ; do
  if [ $RECO_NUM -le 3 ]; then
    TITLE=$(echo "$finding" | jq -r '.title')
    REMEDIATION=$(echo "$finding" | jq -r '.remediation')
    echo "$RECO_NUM. **$TITLE:** $REMEDIATION" >> "$REPORT_FILE"
    RECO_NUM=$((RECO_NUM + 1))
  fi
done

cat >> "$REPORT_FILE" <<BEST_PRACTICES

### Best Practices to Adopt

1. **Security-First Development**
   - Implement pre-commit hooks for secrets detection (GitLeaks)
   - Run security scans in CI/CD pipeline
   - Regular dependency updates with \`npm audit\`

2. **Performance Monitoring**
   - Set up continuous Lighthouse audits
   - Monitor bundle sizes in CI
   - Implement performance budgets

3. **Code Quality Gates**
   - Enforce ESLint rules in CI
   - Require minimum test coverage (80%+)
   - Regular code reviews with checklist

4. **Architectural Governance**
   - Document architectural decisions (ADRs)
   - Regular dependency graph reviews
   - Enforce layered architecture with linting rules

5. **Compliance Monitoring**
   - Automated accessibility testing in CI
   - Regular GDPR/privacy audits
   - FedRAMP compliance checklist reviews

---

## Appendix: Metrics

### Code Complexity
BEST_PRACTICES

if [ -f "$OUTPUT_DIR/03-code-quality-report.json" ]; then
  AVG_COMPLEXITY=$(jq -r '.metrics.complexity.averageComplexity // "N/A"' "$OUTPUT_DIR/03-code-quality-report.json")
  HIGH_COMPLEXITY=$(jq -r '.metrics.complexity.highComplexityFunctions // "N/A"' "$OUTPUT_DIR/03-code-quality-report.json")
  echo "- Average cyclomatic complexity: $AVG_COMPLEXITY" >> "$REPORT_FILE"
  echo "- High complexity functions (>15): $HIGH_COMPLEXITY" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<METRICS

### Test Coverage
METRICS

if [ -f "$OUTPUT_DIR/03-code-quality-report.json" ]; then
  COVERAGE=$(jq -r '.metrics.testCoverage.linesCovered // "N/A"' "$OUTPUT_DIR/03-code-quality-report.json")
  echo "- Line coverage: ${COVERAGE}%" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<BUNDLE

### Bundle Size
BUNDLE

if [ -f "$OUTPUT_DIR/02-performance-report.json" ]; then
  BUNDLE_SIZE=$(jq -r '.metrics.bundleAnalysis.totalSize // "N/A"' "$OUTPUT_DIR/02-performance-report.json")
  BUILD_TIME=$(jq -r '.metrics.bundleAnalysis.buildTime // "N/A"' "$OUTPUT_DIR/02-performance-report.json")
  echo "- Total bundle size: $BUNDLE_SIZE" >> "$REPORT_FILE"
  echo "- Build time: ${BUILD_TIME}s" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<SECURITY

### Security
SECURITY

if [ -f "$OUTPUT_DIR/01-security-audit-report.json" ]; then
  NPM_VULNS=$(jq -r '.scans.npmAudit.metadata.vulnerabilities | to_entries | map("\(.key): \(.value)") | join(", ") // "N/A"' "$OUTPUT_DIR/01-security-audit-report.json" 2>/dev/null || echo "N/A")
  echo "- NPM vulnerabilities: $NPM_VULNS" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<FOOTER

---

## Conclusion

This automated review identified **$TOTAL_ISSUES total issues** across security, performance, code quality, architecture, and compliance domains. The estimated total remediation effort is **$TOTAL_REMEDIATION hours**.

**Priority Focus Areas:**
1. Security vulnerabilities and compliance gaps
2. Performance optimization opportunities
3. Code quality and maintainability improvements
4. Architectural refactoring for scalability

**Next Steps:**
1. Review this report with the development team
2. Create GitHub issues for critical and high priority items
3. Establish remediation timeline and assign owners
4. Set up automated review agents in CI/CD pipeline
5. Schedule follow-up review in 4-6 weeks

---

*This report was generated automatically by the Fleet Code Review System.*
*For questions or clarification on findings, review the individual agent reports and logs.*

**Report Location:** \`$REPORT_FILE\`
**Agent Logs:** \`$OUTPUT_DIR/\`

FOOTER

log_info "Report generated successfully: $REPORT_FILE"

exit 0
