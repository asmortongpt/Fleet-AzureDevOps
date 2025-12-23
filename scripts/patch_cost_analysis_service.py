lines = open('api/src/services/cost-analysis.service.ts').readlines()

# Helper to safely replace
def replace_line(idx, old, new):
    if idx < len(lines):
        if old in lines[idx]:
            lines[idx] = lines[idx].replace(old, new)
        else:
            # Fallback for exact match/strip
            if lines[idx].strip() == old.strip():
                lines[idx] = new + '\n'

# 1. Line 173: AND transaction_date BETWEEN $2 AND $3', -> `
replace_line(172, "AND transaction_date BETWEEN $2 AND $3',", "       AND transaction_date BETWEEN $2 AND $3`,")

# 2. Line 437: ($2 || ` months`)::INTERVAL -> ($2 || ' months')::INTERVAL
replace_line(436, "($2 || ` months`)::INTERVAL", "       AND transaction_date >= CURRENT_DATE - ($2 || ' months')::INTERVAL")

# 3. Line 449: ` GROUP BY DATE_TRUNC(`month`, ...) ... ASC' -> ORDER BY month ASC`
# And fix internal backticks: `month` -> 'month'
# content: query += ` GROUP BY DATE_TRUNC(`month`, transaction_date) ORDER BY month ASC'
if 448 < len(lines):
    lines[448] = "    query += ` GROUP BY DATE_TRUNC('month', transaction_date) ORDER BY month ASC`\n"

# 4. Line 475-479: 'SELECT ' + ... + ' FROM ...`
# Change start to backtick and embed expression?
# Or keep concatenation?
# Original: 'SELECT ' + (await getTableColumns(this.db, 'cost_tracking')).join(', ') + ' FROM cost_tracking
# Next lines continue the string?
# If line 475 ends with ' FROM cost_tracking, it implies end of string.
# But 476 starts '       WHERE...
# This implies 475 has no closing quote?
# Let's rewrite 475-479 to use backticks fully.
# But we can't easily merge lines in this simple script if we are not careful.
# Let's fix line 475 to start with `SELECT ... and end with ... FROM cost_tracking
# And line 479 to end with `
# But 475 has `(await ...)` which needs `${}` if inside backticks.
# Replace 475 with: `SELECT ${(await getTableColumns(this.db, 'cost_tracking')).join(', ')} FROM cost_tracking`
# And then lines 476-479 are effectively a new string?
# Wait, the original code probably wanted one long string.
# If I use backticks, I can span lines.
# 475: `SELECT ${(await ...).join(', ')} FROM cost_tracking
# 476:        WHERE tenant_id = $1
# ...
# 479:        ORDER BY transaction_date DESC`,
if 474 < len(lines):
    lines[474] = "      `SELECT ${(await getTableColumns(this.db, 'cost_tracking')).join(', ')} FROM cost_tracking\n"

# 5. Line 551: '`, -> '',
replace_line(550, "row.driver_name || '`,", "        row.driver_name || '',")

# 6. Line 552: || `` -> || ''
replace_line(551, "row.vendor_name || ``", "        row.vendor_name || ''")

# 7. Line 555: .join(`,`) + `\n' -> .join(',') + '\\n'"
# Actually original: csv += values.map(v => `"${v}"`).join(`,`) + `\n'
# Fix to: csv += values.map(v => `"${v}"`).join(',') + '\n'
if 554 < len(lines):
    lines[554] = "      csv += values.map(v => `\"${v}\"`).join(',') + '\\n'\n"

# Helper for getTableColumns assumed?
# The error text didn't show 'getTableColumns' as undefined, but as syntax error.
# Is getTableColumns defined? It's not in the file imports or class!
# It might be a missing import or helper function at bottom?
# I saw `import { Pool } from 'pg'` and `costForecastingModel`.
# If getTableColumns is missing, that's a ReferenceError next.
# But let's fix syntax first.

with open('api/src/services/cost-analysis.service.ts', 'w') as f:
    f.writelines(lines)
