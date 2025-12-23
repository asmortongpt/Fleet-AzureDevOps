lines = open('api/src/services/scheduling.service.ts').readlines()

# Line 820: 'SELECT vr.*, -> `SELECT vr.*,
# Note: look for the distinct start of the string
for i in range(len(lines)):
    if "'SELECT vr.*, u.first_name" in lines[i]:
        lines[i] = lines[i].replace("'SELECT vr.*, u.first_name", "`SELECT vr.*, u.first_name")

with open('api/src/services/scheduling.service.ts', 'w') as f:
    f.writelines(lines)
