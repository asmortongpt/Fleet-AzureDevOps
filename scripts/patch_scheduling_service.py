lines = open('api/src/services/scheduling.service.ts').readlines()

# Line 256: `cancelled`, `completed' -> 'cancelled', 'completed'
for i in range(len(lines)):
    if "`cancelled`, `completed'" in lines[i]:
        lines[i] = lines[i].replace("`cancelled`, `completed'", "'cancelled', 'completed'")

# Line 617: <br/>' : ''} -> <br/>` : ''}
for i in range(len(lines)):
    if "<br/>' : ''}" in lines[i]:
        lines[i] = lines[i].replace("<br/>' : ''}", "<br/>` : ''}")

# Line 699: return const appt -> return \n const appt
for i in range(len(lines)):
    if "return const appt" in lines[i]:
        lines[i] = lines[i].replace("return const appt", "return\n    const appt")

# Line 708: <br/>' : ''} -> <br/>` : ''}
for i in range(len(lines)):
    # Same as line 617 logic, but verify context if needed.
    # The string is unique enough.
    if "<br/>' : ''}" in lines[i]:
        lines[i] = lines[i].replace("<br/>' : ''}", "<br/>` : ''}")

with open('api/src/services/scheduling.service.ts', 'w') as f:
    f.writelines(lines)
