lines = open('api/src/routes/custom-reports.routes.ts').readlines()

# Line 206: if (!['xlsx', 'csv', 'pdf'].includes(format) { -> ...)) {
if 205 < len(lines):
    if "includes(format) {" in lines[205]:
        lines[205] = lines[205].replace("includes(format) {", "includes(format)) {")

# Line 290: Fix Header Quotes
if 289 < len(lines):
    if 'res.setHeader(`Content-Disposition`' in lines[289]:
        lines[289] = '        res.setHeader(\'Content-Disposition\', `attachment; filename="${executionRecord.id}.${extension}"`)\n'

# Line 294: logger.error(...) missing )
if 293 < len(lines):
    if "getErrorMessage(error)" in lines[293] and not lines[293].strip().startswith("return"):
         # It ends with // Wave 21...
         # Replace getErrorMessage(error) with getErrorMessage(error))
         lines[293] = lines[293].replace("getErrorMessage(error)", "getErrorMessage(error))")

# Line 323: includes(schedule_type) { -> includes(schedule_type)) {
if 322 < len(lines):
    if "includes(schedule_type) {" in lines[322]:
        lines[322] = lines[322].replace("includes(schedule_type) {", "includes(schedule_type)) {")

# Line 329: includes(format) { -> includes(format)) {
if 328 < len(lines):
    if "includes(format) {" in lines[328]:
        lines[328] = lines[328].replace("includes(format) {", "includes(format)) {")

# Duplicate csrfProtection
# Lines 54, 126, 310, 375, 395
for i in [54, 126, 310, 375, 395]:
    idx = i - 1
    if idx < len(lines):
        lines[idx] = lines[idx].replace('csrfProtection,  csrfProtection,', 'csrfProtection,')

with open('api/src/routes/custom-reports.routes.ts', 'w') as f:
    f.writelines(lines)
