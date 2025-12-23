lines = open('api/src/services/obd2.service.ts').readlines()

for i in range(len(lines)):
    # Fix 300: status?: 'active' | 'pending' | 'cleared` | `resolved`
    if "status?:" in lines[i] and "`" in lines[i]:
        lines[i] = lines[i].replace("`", "'")

with open('api/src/services/obd2.service.ts', 'w') as f:
    f.writelines(lines)
