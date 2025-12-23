lines = open('api/src/services/google-calendar.service.ts').readlines()

# Line 587: 'SELECT id ... provider = $2`, -> `SELECT id ... provider = $2`,
for i in range(len(lines)):
    if "'SELECT id FROM calendar_events" in lines[i]:
        lines[i] = lines[i].replace("'SELECT id FROM calendar_events", "`SELECT id FROM calendar_events")

with open('api/src/services/google-calendar.service.ts', 'w') as f:
    f.writelines(lines)
