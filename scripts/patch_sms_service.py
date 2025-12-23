lines = open('api/src/services/sms.service.ts').readlines()

for i in range(len(lines)):
    # Line 283: `delivered` -> 'delivered'
    if "$1 = `delivered`" in lines[i]:
        lines[i] = lines[i].replace("`delivered`", "'delivered'")

    # Line 407: RETURNING id', -> RETURNING id`,
    if "RETURNING id'," in lines[i]:
        lines[i] = lines[i].replace("RETURNING id',", "RETURNING id`,")

with open('api/src/services/sms.service.ts', 'w') as f:
    f.writelines(lines)
