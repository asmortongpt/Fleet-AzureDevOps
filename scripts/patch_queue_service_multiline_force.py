lines = open('api/src/services/queue.service.ts').readlines()

# Force replace index 607 (line 608)
if lines[607].strip().startswith("'SELECT"):
    lines[607] = lines[607].replace("'", "`", 1)

# Force replace index 624 (line 625)
if lines[624].strip().endswith("',"):
    lines[624] = lines[624].replace("',", "`,")

with open('api/src/services/queue.service.ts', 'w') as f:
    f.writelines(lines)
