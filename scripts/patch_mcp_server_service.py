lines = open('api/src/services/mcp-server.service.ts').readlines()

# Line 294: WHERE id = $3', -> WHERE id = $3`,
found = False
for i in range(len(lines)):
    if "WHERE id = $3'," in lines[i]:
        lines[i] = lines[i].replace("WHERE id = $3',", "WHERE id = $3`,")
        found = True

if not found:
    print("Target string not found!")

with open('api/src/services/mcp-server.service.ts', 'w') as f:
    f.writelines(lines)
