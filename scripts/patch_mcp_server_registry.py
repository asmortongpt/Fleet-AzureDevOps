lines = open('api/src/services/mcp-server-registry.service.ts').readlines()

# Line 322: 'SELECT -> `SELECT
if 321 < len(lines):
    if "'SELECT" in lines[321]:
        lines[321] = lines[321].replace("'SELECT", "`SELECT")

# Line 340: id = $1', -> id = $1`,
if 339 < len(lines):
    if "id = $1'," in lines[339]:
        lines[339] = lines[339].replace("id = $1',", "id = $1`,")

# Line 357: INTERVAL '15 minutes'', -> INTERVAL '15 minutes'`,
if 356 < len(lines):
    if "INTERVAL '15 minutes''," in lines[356]:
        lines[356] = lines[356].replace("INTERVAL '15 minutes'',", "INTERVAL '15 minutes'`,")

with open('api/src/services/mcp-server-registry.service.ts', 'w') as f:
    f.writelines(lines)
