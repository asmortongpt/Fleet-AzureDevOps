lines = open('api/src/services/executive-dashboard.service.ts').readlines()

# Line 396: INTERVAL `30 days` -> INTERVAL '30 days'
if 395 < len(lines):
    if "INTERVAL `30 days`" in lines[395]:
        lines[395] = lines[395].replace("INTERVAL `30 days`", "INTERVAL '30 days'")

with open('api/src/services/executive-dashboard.service.ts', 'w') as f:
    f.writelines(lines)
