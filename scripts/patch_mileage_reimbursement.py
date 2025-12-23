lines = open('api/src/routes/mileage-reimbursement.ts').readlines()

# Line 154: parseFloat((milesFloat * applicableRate).toFixed(2)
# Add missing )
if 153 < len(lines):
    if 'parseFloat((milesFloat * applicableRate).toFixed(2)' in lines[153] and not lines[153].strip().endswith('))'):
        lines[153] = lines[153].replace('.toFixed(2)', '.toFixed(2))')

# Duplicate csrfProtection
# Lines 107, 224, 299
for i in [107, 224, 299]:
    idx = i - 1
    if idx < len(lines):
        lines[idx] = lines[idx].replace('csrfProtection,  csrfProtection,', 'csrfProtection,')

with open('api/src/routes/mileage-reimbursement.ts', 'w') as f:
    f.writelines(lines)
