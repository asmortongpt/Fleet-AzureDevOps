lines = open('api/src/services/calendar.service.ts').readlines()

# Line 264: `cancelled` -> 'cancelled'
for i in range(len(lines)):
    if "`cancelled`" in lines[i]:
        lines[i] = lines[i].replace("`cancelled`", "'cancelled'")

with open('api/src/services/calendar.service.ts', 'w') as f:
    f.writelines(lines)
