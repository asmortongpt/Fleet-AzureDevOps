lines = open('api/src/services/excel-export.service.ts').readlines()

# Line 264: utf-8') -> utf-8') (Wait, it was `utf-8')
# Viewer: fs.writeFile(filepath, lines.join(`\n`), `utf-8')
if 263 < len(lines):
    if "`utf-8')" in lines[263]:
        lines[263] = lines[263].replace("`utf-8')", "'utf-8')")

# Line 391: replace(/"/g, """") -> replace(/"/g, '""')
if 390 < len(lines):
    if 'replace(/"/g, """")' in lines[390]:
        lines[390] = lines[390].replace('replace(/"/g, """")', "replace(/\"/g, '\"\"')")

with open('api/src/services/excel-export.service.ts', 'w') as f:
    f.writelines(lines)
