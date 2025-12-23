lines = open('api/src/services/scheduling-notification.service.ts').readlines()

# Line 550: String(value || '`)) -> String(value || ''))
for i in range(len(lines)):
    if "String(value || '`))" in lines[i]:
        lines[i] = lines[i].replace("String(value || '`))", "String(value || ''))")

# Line 815: `Sent` -> 'Sent'
for i in range(len(lines)):
    if "`Sent`" in lines[i]:
        lines[i] = lines[i].replace("`Sent`", "'Sent'")

# Line 816: RETURNING id', -> RETURNING id`,
for i in range(len(lines)):
    if "RETURNING id'," in lines[i]:
        lines[i] = lines[i].replace("RETURNING id',", "RETURNING id`,")

# Line 833: 'Primary Subject')', -> 'Primary Subject')`,
for i in range(len(lines)):
    if "'Primary Subject')'," in lines[i]:
        lines[i] = lines[i].replace("'Primary Subject')',", "'Primary Subject')`,")

# Line 874: INTERVAL '2 hours'', -> INTERVAL '2 hours'`,
for i in range(len(lines)):
    if "INTERVAL '2 hours''," in lines[i]:
        lines[i] = lines[i].replace("INTERVAL '2 hours'',", "INTERVAL '2 hours'`,")

with open('api/src/services/scheduling-notification.service.ts', 'w') as f:
    f.writelines(lines)
