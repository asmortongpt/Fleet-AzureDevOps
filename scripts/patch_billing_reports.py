lines = open('api/src/routes/billing-reports.ts').readlines()

# Line 107: res.setHeader(`Content-Disposition`, "attachment; filename="payroll-deductions-${period}.csv"")
# Fix quote nesting. use single quotes for header name, and backticks for value if needed.
if 106 < len(lines):
    if 'res.setHeader(`Content-Disposition`,' in lines[106] or 'filename="payroll' in lines[106]:
        lines[106] = "      res.setHeader('Content-Disposition', `attachment; filename=\"payroll-deductions-${period}.csv\"`)\n"

# Line 125: csrfProtection,  csrfProtection,
if 124 < len(lines):
    lines[124] = lines[124].replace('csrfProtection,  csrfProtection,', 'csrfProtection,')

with open('api/src/routes/billing-reports.ts', 'w') as f:
    f.writelines(lines)
