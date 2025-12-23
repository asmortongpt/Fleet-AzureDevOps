lines = open('api/src/ml-models/fleet-optimization.model.ts').readlines()

# Line 186: INTERVAL '90 days'', -> INTERVAL '90 days'`,
for i in range(len(lines)):
    if "INTERVAL '90 days''," in lines[i]:
        lines[i] = lines[i].replace("INTERVAL '90 days'',", "INTERVAL '90 days'`,")

with open('api/src/ml-models/fleet-optimization.model.ts', 'w') as f:
    f.writelines(lines)
