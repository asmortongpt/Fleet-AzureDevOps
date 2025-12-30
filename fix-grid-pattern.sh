#!/bin/bash
# Fix MUI Grid component pattern across all files
# Old: <Grid item xs={6} md={3}>
# New: <Grid size={{ xs: 6, md: 3 }}>

cd /Users/andrewmorton/Documents/GitHub/fleet-local

echo "Fixing Grid patterns..."

# Find all .tsx files with Grid usage
find src -name "*.tsx" -type f -exec grep -l "Grid.*item.*xs" {} \; | while read file; do
  echo "Fixing: $file"

  # Use Perl for more powerful regex replacement
  perl -i -pe '
    # Pattern 1: item xs={X} md={Y}
    s/<Grid\s+item\s+xs=\{(\d+)\}\s+md=\{(\d+)\}>/<Grid size={{ xs: $1, md: $2 }}>/g;

    # Pattern 2: item xs={X} sm={Y} md={Z}
    s/<Grid\s+item\s+xs=\{(\d+)\}\s+sm=\{(\d+)\}\s+md=\{(\d+)\}>/<Grid size={{ xs: $1, sm: $2, md: $3 }}>/g;

    # Pattern 3: item xs={X}
    s/<Grid\s+item\s+xs=\{(\d+)\}>/<Grid size={{ xs: $1 }}>/g;

    # Pattern 4: item md={X}
    s/<Grid\s+item\s+md=\{(\d+)\}>/<Grid size={{ md: $1 }}>/g;

    # Pattern 5: item sm={X}
    s/<Grid\s+item\s+sm=\{(\d+)\}>/<Grid size={{ sm: $1 }}>/g;

    # Pattern 6: item lg={X}
    s/<Grid\s+item\s+lg=\{(\d+)\}>/<Grid size={{ lg: $1 }}>/g;

    # Pattern 7: item xl={X}
    s/<Grid\s+item\s+xl=\{(\d+)\}>/<Grid size={{ xl: $1 }}>/g;

    # Pattern 8: item (just the item prop alone)
    s/<Grid\s+item>/<Grid>/g;
  ' "$file"
done

echo "Done fixing Grid patterns!"
echo ""
echo "Checking error count..."
./node_modules/.bin/tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || echo "0"
