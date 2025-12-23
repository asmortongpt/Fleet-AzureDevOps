lines = open('api/src/services/google-calendar.service.ts').readlines()

# Line 100 & 122 & 691: 'SELECT -> `SELECT
for i in range(len(lines)):
    if "? 'SELECT" in lines[i]:
        lines[i] = lines[i].replace("? 'SELECT", "? `SELECT")
    elif ": 'SELECT" in lines[i]:
        lines[i] = lines[i].replace(": 'SELECT", ": `SELECT")
    elif lines[i].strip() == "'SELECT":
        lines[i] = lines[i].replace("'SELECT", "`SELECT")

# Line 121 & 143 & 712: closing quotes
for i in range(len(lines)):
    if "provider = $2'" in lines[i]:
         lines[i] = lines[i].replace("provider = $2'", "provider = $2`")
    if "LIMIT 1'" in lines[i]:
         lines[i] = lines[i].replace("LIMIT 1'", "LIMIT 1`")
    if "provider = $3'," in lines[i]:
         lines[i] = lines[i].replace("provider = $3',", "provider = $3`,")

with open('api/src/services/google-calendar.service.ts', 'w') as f:
    f.writelines(lines)
