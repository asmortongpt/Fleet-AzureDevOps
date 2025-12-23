lines = open('api/src/services/obd2.service.ts').readlines()

for i in range(len(lines)):
    line = lines[i].rstrip()
    
    # Fix 206: WHERE tenant_id = $1 AND id = $2',
    if line.endswith("WHERE tenant_id = $1 AND id = $2',"):
        lines[i] = lines[i].replace("id = $2',", "id = $2`,")

    # Fix 224: WHERE id = $1',
    if line.endswith("WHERE id = $1',"):
        lines[i] = lines[i].replace("id = $1',", "id = $1`,")
        
    # Fix 253: status = 'active'',
    if "status = 'active''," in line:
        lines[i] = lines[i].replace("status = 'active'',", "status = 'active'`,")

    # Fix 334: status = `cleared`,
    if "status = `cleared`," in line:
        lines[i] = lines[i].replace("status = `cleared`,", "status = 'cleared',")

    # Fix 339, 581: RETURNING id',
    if "RETURNING id'," in line:
        lines[i] = lines[i].replace("RETURNING id',", "RETURNING id`,")
        
    # Fix 381: WHERE id = $1',  (Same as 224?)
    # Line 381 content: WHERE id = $1',
    # Logic for 224 handles it if identical.
    
    # Fix 485: WHERE tenant_id = $1 AND vehicle_id = $2',
    if "WHERE tenant_id = $1 AND vehicle_id = $2'," in line:
        lines[i] = lines[i].replace("vehicle_id = $2',", "vehicle_id = $2`,")
        
    # Fix 501: WHERE tenant_id = $1 AND adapter_id = $2',
    if "WHERE tenant_id = $1 AND adapter_id = $2'," in line:
        lines[i] = lines[i].replace("adapter_id = $2',", "adapter_id = $2`,")

    # Fix 585: dtc.severity === 'critical' ? 'critical' : 'high`,
    if "dtc.severity === 'critical' ? 'critical' : 'high`," in line:
        lines[i] = lines[i].replace("'high`,", "'high',")

with open('api/src/services/obd2.service.ts', 'w') as f:
    f.writelines(lines)
