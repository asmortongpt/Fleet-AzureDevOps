lines = open('api/src/services/custom-report.service.ts').readlines()

# Line 801: WHERE id = $1', -> WHERE id = $1`,
if 800 < len(lines):
    if "WHERE id = $1'," in lines[800]:
        lines[800] = lines[800].replace("WHERE id = $1',", "WHERE id = $1`,")

with open('api/src/services/custom-report.service.ts', 'w') as f:
    f.writelines(lines)
