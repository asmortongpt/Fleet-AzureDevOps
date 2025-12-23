lines = open('api/src/routes/costs.ts').readlines()

# Line 304 (index 303): })) -> }));
if lines[303].strip() == '}))':
    lines[303] = lines[303].replace('}))', '}));')

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
