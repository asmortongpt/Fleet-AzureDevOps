#!/bin/bash
# Create Architecture Decision Record (ADR)
# Usage: ./create-adr.sh "Decision title"

set -e

if [ -z "$1" ]; then
  echo "Usage: ./create-adr.sh \"Decision title\""
  echo "Example: ./create-adr.sh \"Use PostgreSQL for primary database\""
  exit 1
fi

TITLE="$1"
ADR_DIR="./decisions"
mkdir -p "$ADR_DIR"

# Get next ADR number
LAST_NUM=$(ls "$ADR_DIR" 2>/dev/null | grep -E '^[0-9]{4}-' | sort | tail -1 | cut -d'-' -f1 | sed 's/^0*//')
NEXT_NUM=$(printf "%04d" $((LAST_NUM + 1)))

# Generate filename
FILENAME="${NEXT_NUM}-$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').md"
FILEPATH="$ADR_DIR/$FILENAME"

# Create ADR from template
cat > "$FILEPATH" <<EOF
# ADR-${NEXT_NUM}: ${TITLE}

**Date**: $(date +%Y-%m-%d)

**Status**: Proposed

**Authors**: $(git config user.name || echo "Unknown")

---

## Context

What is the issue we're addressing? What factors are at play? What are the business and technical constraints?

## Decision

What is the change we're proposing and/or doing?

## Rationale

Why did we choose this option over alternatives?

## Consequences

### Positive
- What becomes easier or better as a result of this decision?

### Negative
- What becomes harder or worse as a result of this decision?

### Risks
- What risks are introduced by this decision?

## Alternatives Considered

### Option A: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

### Option B: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

## Implementation Notes

- How will this decision be implemented?
- What are the key milestones?
- Are there any prerequisites?

## References

- Link to related documents, discussions, or resources
- Technical documentation
- Related ADRs

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| $(date +%Y-%m-%d) | $(git config user.name || echo "Unknown") | Initial version |
EOF

echo "✓ Created ADR: $FILEPATH"
echo ""
echo "Next steps:"
echo "1. Edit $FILEPATH"
echo "2. Fill in all sections"
echo "3. Get team review"
echo "4. Update status to 'Accepted' or 'Rejected'"
echo ""
echo "Opening in editor..."

# Open in default editor
${EDITOR:-nano} "$FILEPATH"
