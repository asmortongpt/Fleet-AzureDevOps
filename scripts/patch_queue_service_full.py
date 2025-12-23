lines = open('api/src/services/queue.service.ts').readlines()

# Helpers
def replace_at(lines, content_check, old, new):
    for i, line in enumerate(lines):
        if content_check in line:
            lines[i] = line.replace(old, new)

# 1. Line 407: join(`, `)} WHERE id = $1',
replace_at(lines, 'join(`, `)} WHERE id = $1', "',", "`,")

# 2. Line 437: WHERE id = $1', -> WHERE id = $1`,
replace_at(lines, "WHERE id = $1',", "',", "`,")

# 3. Line 444: WHERE id = $1', -> WHERE id = $1`, 
replace_at(lines, "WHERE id = $1',", "',", "`,")

# 4. Line 544: WHERE job_id = $1', -> WHERE job_id = $1`,
replace_at(lines, "WHERE job_id = $1',", "',", "`,")

# 5. Line 561: WHERE job_id = $1', -> WHERE job_id = $1`,
replace_at(lines, "WHERE job_id = $1',", "',", "`,")

# 6. Line 679: '24 hours'', -> '24 hours'`,
replace_at(lines, "'24 hours'',", "',", "`,")

with open('api/src/services/queue.service.ts', 'w') as f:
    f.writelines(lines)
