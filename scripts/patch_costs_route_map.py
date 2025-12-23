lines = open('api/src/routes/costs.ts').readlines()

# Line 175 (index 174)
# 175: }).sort((a, b) => b.amount - a.amount)
# Should be: })).sort((a, b) => b.amount - a.amount)

if '}).sort((a, b) => b.amount - a.amount)' in lines[174]:
    lines[174] = lines[174].replace('}).sort', '})).sort')

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
