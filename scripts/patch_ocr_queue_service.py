lines = open('api/src/services/OcrQueueService.ts').readlines()

# Helpers
def replace_at(idx, old, new):
    if idx < len(lines):
        lines[idx] = lines[idx].replace(old, new)

# 1. Line 133: RETURNING id', -> RETURNING id`,
replace_at(132, "RETURNING id',", "RETURNING id`,")

# 2. Line 274: `completed` -> 'completed'
replace_at(273, "`completed`", "'completed'")

# 3. Line 298: `failed` -> 'failed'
replace_at(297, "`failed`", "'failed'")

# 4. Line 381: `progress = $3', -> `progress = $3`,
replace_at(380, "`progress = $3',", "`progress = $3`,")

# 5. Line 407: join(`, `) -> join(', ') AND id = $1', -> id = $1`,
replace_at(406, "join(`, `)", "join(', ')")
replace_at(406, "id = $1',", "id = $1`,")

# 6. Line 437: WHERE id = $1', -> WHERE id = $1`,
replace_at(436, "WHERE id = $1',", "WHERE id = $1`,")

# 7. Line 444: WHERE id = $1', -> WHERE id = $1`,
replace_at(443, "WHERE id = $1',", "WHERE id = $1`,")

# 8. Line 484: WHERE id = $1', -> WHERE id = $1`,
replace_at(483, "WHERE id = $1',", "WHERE id = $1`,")

# 9. Line 671: `24 hours` -> '24 hours'
replace_at(670, "`24 hours`", "'24 hours'")

# 10. Line 730: tenant_id = $1' -> tenant_id = $1`
replace_at(729, "tenant_id = $1'", "tenant_id = $1`")

# 11. Garbage removal (REFERENCES, ON...)
# Lines 527-530 and 609-612
def clear_garbage(start_line_hint):
    for i, line in enumerate(lines):
        if 'REFERENCES,' in line and i > start_line_hint:
            # Check next lines
            if 'ON,' in lines[i+1] and 'REFERENCES,' in lines[i+2]:
                lines[i] = ''
                lines[i+1] = ''
                lines[i+2] = ''
                # Line i+3: ON FROM ...
                if lines[i+3].strip().startswith('ON FROM'):
                    lines[i+3] = lines[i+3].replace('ON FROM', 'FROM')

# Run garbage cleaner roughly
clear_garbage(500)
clear_garbage(600)

with open('api/src/services/OcrQueueService.ts', 'w') as f:
    f.writelines(lines)
