lines = open('api/src/jobs/report-scheduler.job.ts').readlines()

# Line 275: format?: 'xlsx' | 'csv` | `pdf' -> format?: 'xlsx' | 'csv' | 'pdf'
# Wait, file content said: format?: 'xlsx' | 'csv' | `pdf'
# Wait, check viewer.
# 275:     format?: 'xlsx' | 'csv` | `pdf'
# It has `csv` | `pdf'. Actually checking the viewer output:
# 275:     format?: 'xlsx' | 'csv` | `pdf'
# Wait, it looks like 'csv' is normal?
# Viewer: 275:     format?: 'xlsx' | 'csv` | `pdf'
# Ah, `csv` ends with backtick? No.
# `format?: 'xlsx' | 'csv` | `pdf'`
# It seems there is a backtick after csv?
# Or maybe it is 'csv' | `pdf'
# Let's replace the whole line to be safe.
if 274 < len(lines):
    if "format?:" in lines[274]:
        lines[274] = "    format?: 'xlsx' | 'csv' | 'pdf'\n"

# Also check line 245: RETURNING id', -> RETURNING id`,
if 244 < len(lines):
    if "RETURNING id'," in lines[244]:
        lines[244] = lines[244].replace("RETURNING id',", "RETURNING id`,")

with open('api/src/jobs/report-scheduler.job.ts', 'w') as f:
    f.writelines(lines)
