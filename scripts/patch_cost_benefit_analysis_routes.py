lines = open('api/src/routes/cost-benefit-analysis.routes.ts').readlines()

# 1. Line 136: params.slice(0, -2) -> params.slice(0, -2))
if 135 < len(lines):
    if 'params.slice(0, -2)' in lines[135] and not lines[135].strip().endswith('))'):
         lines[135] = lines[135].replace('params.slice(0, -2)', 'params.slice(0, -2))')

# 2. Line 145: Math.ceil(total / parseInt(limit as string), -> Math.ceil(total / parseInt(limit as string)),
if 144 < len(lines):
    if 'Math.ceil' in lines[144] and lines[144].strip().endswith(','):
        # Look for missing closing paren for ceil
        # "pages: Math.ceil(total / parseInt(limit as string),"
        # It has ( ( ) ) ,
        # count ( : 2
        # count ) : 1
        lines[144] = lines[144].replace('limit as string),', 'limit as string)),')

# 3. Duplicate csrfProtection
# Lines 220, 313, 379, 432
for i in [219, 312, 378, 431]:
    if i < len(lines):
        lines[i] = lines[i].replace('csrfProtection,  csrfProtection,', 'csrfProtection,')

with open('api/src/routes/cost-benefit-analysis.routes.ts', 'w') as f:
    f.writelines(lines)
