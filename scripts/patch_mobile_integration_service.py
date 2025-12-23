lines = open('api/src/services/mobile-integration.service.ts').readlines()

for i in range(len(lines)):
    # Line 536: `Available` -> 'Available'
    if "`Available`" in lines[i]:
        lines[i] = lines[i].replace("`Available`", "'Available'")

    # Line 200: WHERE device_id = $2` -> WHERE device_id = $2`,
    if "WHERE device_id = $2`" in lines[i]:
        lines[i] = lines[i].replace("WHERE device_id = $2`", "WHERE device_id = $2`,")

    # Line 300: id = $2` -> id = $2`,
    # (checking context to avoid false positives)
    if "updated_at FROM vehicles WHERE tenant_id = $1 AND id = $2`" in lines[i]:
        lines[i] = lines[i].replace("id = $2`", "id = $2`,")

    # Line 340: WHERE id = $1` -> WHERE id = $1`,
    if "updated_at FROM optimized_routes WHERE id = $1`" in lines[i]:
        lines[i] = lines[i].replace("id = $1`", "id = $1`,")
    
    # Line 468: 'open')` -> 'open')`,
    if "'open')`" in lines[i]:
        lines[i] = lines[i].replace("'open')`", "'open')`,")


with open('api/src/services/mobile-integration.service.ts', 'w') as f:
    f.writelines(lines)
