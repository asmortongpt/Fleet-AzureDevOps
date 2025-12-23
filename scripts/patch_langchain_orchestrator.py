lines = open('api/src/services/langchain-orchestrator.service.ts').readlines()

# Line 609: tenant_id = $2', -> tenant_id = $2`,
if 608 < len(lines):
    if "tenant_id = $2'," in lines[608]:
        lines[608] = lines[608].replace("tenant_id = $2',", "tenant_id = $2`,")

# Line 631: `maintenance`, -> 'maintenance',
if 630 < len(lines):
    if "`maintenance`," in lines[630]:
        lines[630] = lines[630].replace("`maintenance`,", "'maintenance',")

# Line 673: `maintenance` -> 'maintenance'
if 672 < len(lines):
    if "`maintenance`" in lines[672]:
        lines[672] = lines[672].replace("`maintenance`", "'maintenance'")

# Line 704: `maintenance` -> 'maintenance'
if 703 < len(lines):
    if "`maintenance`" in lines[703]:
        lines[703] = lines[703].replace("`maintenance`", "'maintenance'")

# Line 743: `Auto-assigned`, -> 'Auto-assigned',
if 742 < len(lines):
    if "`Auto-assigned`," in lines[742]:
        lines[742] = lines[742].replace("`Auto-assigned`,", "'Auto-assigned',")

# Line 855: `Location A`, -> 'Location A',
if 854 < len(lines):
    if "`Location A`," in lines[854]:
        lines[854] = lines[854].replace("`Location A`,", "'Location A',")

with open('api/src/services/langchain-orchestrator.service.ts', 'w') as f:
    f.writelines(lines)
