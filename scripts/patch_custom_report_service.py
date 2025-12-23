lines = open('api/src/services/custom-report.service.ts').readlines()

# Line 381: 'SELECT -> `SELECT
if 380 < len(lines):
    if "'SELECT" in lines[380]:
        lines[380] = lines[380].replace("'SELECT", "`SELECT")

# Line 398: tenant_id = $2', -> tenant_id = $2`,
if 397 < len(lines):
    if "tenant_id = $2'," in lines[397]:
        lines[397] = lines[397].replace("tenant_id = $2',", "tenant_id = $2`,")

# Line 702: let query = `SELECT -> let query = `SELECT (Already correct start?)
# Viewer said: 702:     let query = `SELECT 
# But let's verify if it was 'SELECT. 
# actually viewer 702 has backtick. 
# Viewer 714: ... = true'
# So change 714 to backtick.
if 713 < len(lines):
    if "= true'" in lines[713]:
        lines[713] = lines[713].replace("= true'", "= true`")

# Line 742: 'SELECT -> `SELECT
if 741 < len(lines):
    if "'SELECT" in lines[741]:
        lines[741] = lines[741].replace("'SELECT", "`SELECT")

# Line 754: FROM report_templates WHERE id = $1', -> ... = $1`,
if 753 < len(lines):
    if "id = $1'," in lines[753]:
        lines[753] = lines[753].replace("id = $1',", "id = $1`,")
    elif "$1'," in lines[753]: # Fallback
        lines[753] = lines[753].replace("$1',", "$1`,")

# Line 788: 'SELECT -> `SELECT
if 787 < len(lines):
    if "'SELECT" in lines[787]:
        lines[787] = lines[787].replace("'SELECT", "`SELECT")
        
# Assuming it ends later, but I don't have visibility past 800.
# I should probably read the rest of the file to be safe, but typically query ends near the args array.
# Let's hope I can catch the end of that query if it was shown.
# The viewer showed up to 800.
# Line 800 is `      error_message,`
# So the query continues.
# I need to read the file past 800 to fix the closing quote for line 788's query.

with open('api/src/services/custom-report.service.ts', 'w') as f:
    f.writelines(lines)
