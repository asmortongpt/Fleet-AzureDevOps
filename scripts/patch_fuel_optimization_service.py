lines = open('api/src/services/fuel-optimization.service.ts').readlines()

# Line 143: INTERVAL '30 days'', -> INTERVAL '30 days'`,
if 142 < len(lines):
    if "INTERVAL '30 days''," in lines[142]:
        lines[142] = lines[142].replace("INTERVAL '30 days'',", "INTERVAL '30 days'`,")

# Line 230: 'active'', -> 'active'`, and change start to backtick 
if 229 < len(lines):
    if "status = 'active''," in lines[229]:
        # 'SELECT ... 'active'',
        # Replace 'SELECT with `SELECT
        lines[229] = lines[229].replace("'SELECT", "`SELECT").replace("'active'',", "'active'`,")

# Line 240: let recommendation = `` -> let recommendation = ''
if 239 < len(lines):
    if "let recommendation = ``" in lines[239]:
        lines[239] = "        let recommendation = ''\n"

# Line 479: ) monthly_data`, -> ) monthly_data`,
# Wait, line 470 started with `SELECT.
# Line 479 is `) monthly_data`,
# It seems correct in my thought but maybe not in file?
# Viewer: 479:          ) monthly_data`
# Viewer: 480:          [tenantId]
# Line 479 is missing comma if it's argument to query?
# Wait, 480 starts with comma?
# Viewer: 480:          [tenantId] (starts with space)
# Code:
# 479:          ) monthly_data`
# 480:         [tenantId]
# This is invalid because query(sql, params). Comma needed.
# But 479 has ` at the end.
# If 479 is `... monthly_data`, it is a string.
# Then 480 is `[tenantId]`.
# Missing comma between string and array.
if 478 < len(lines):
    if "monthly_data`" in lines[478] and "," not in lines[478]: # Check if comma missing
         lines[478] = lines[478].replace("monthly_data`", "monthly_data`,")

with open('api/src/services/fuel-optimization.service.ts', 'w') as f:
    f.writelines(lines)
