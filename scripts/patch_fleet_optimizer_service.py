lines = open('api/src/services/fleet-optimizer.service.ts').readlines()

# Line 143: WHERE id = $1 AND tenant_id = $2', -> WHERE id = $1 AND tenant_id = $2`,
for i in range(len(lines)):
    if "WHERE id = $1 AND tenant_id = $2'," in lines[i]:
        lines[i] = lines[i].replace("WHERE id = $1 AND tenant_id = $2',", "WHERE id = $1 AND tenant_id = $2`,")

# Line 320: RETURNING id', -> RETURNING id`,
for i in range(len(lines)):
    if "RETURNING id'," in lines[i]:
        lines[i] = lines[i].replace("RETURNING id',", "RETURNING id`,")

with open('api/src/services/fleet-optimizer.service.ts', 'w') as f:
    f.writelines(lines)
