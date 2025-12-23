lines = open('api/src/services/fuel-purchasing.service.ts').readlines()

# Line 299: INTERVAL '24 hours'', -> INTERVAL '24 hours'`,
if 298 < len(lines):
    if "INTERVAL '24 hours''," in lines[298]:
        lines[298] = lines[298].replace("INTERVAL '24 hours'',", "INTERVAL '24 hours'`,\n")

# Line 442: AND status = 'completed'', -> AND status = 'completed'`,
if 441 < len(lines):
    if "AND status = 'completed''," in lines[441]:
        lines[441] = lines[441].replace("AND status = 'completed'',", "AND status = 'completed'`,\n")

# Line 511: const states = ['CA', 'TX', 'FL', 'NY`, `IL`] -> const states = ['CA', 'TX', 'FL', 'NY', 'IL']
if 510 < len(lines):
    if "'NY`, `IL`]" in lines[510]:
        lines[510] = "    const states = ['CA', 'TX', 'FL', 'NY', 'IL']\n"

with open('api/src/services/fuel-purchasing.service.ts', 'w') as f:
    f.writelines(lines)
