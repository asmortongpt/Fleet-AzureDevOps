lines = open('api/src/routes/calendar.routes.ts').readlines()

# Fix missing closing parens in logger.error lines
# Pattern: logger.error(..., getErrorMessage(error) // Wave 25: Winston logger
# Needs to become: logger.error(..., getErrorMessage(error)) // Wave 25: Winston logger

for i in range(len(lines)):
    line = lines[i]
    if "logger.error" in line and "getErrorMessage(error)" in line and "// Wave 25: Winston logger" in line:
        if "getErrorMessage(error))" not in line:
            lines[i] = line.replace("getErrorMessage(error)", "getErrorMessage(error))")

with open('api/src/routes/calendar.routes.ts', 'w') as f:
    f.writelines(lines)
