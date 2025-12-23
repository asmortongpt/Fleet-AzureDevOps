lines = open('api/src/routes/fuel-purchasing.routes.ts').readlines()

# Line 24: if (Array.isArray(data) { -> if (Array.isArray(data)) {
if 23 < len(lines):
    if '(Array.isArray(data)' in lines[23] and not lines[23].strip().endswith(')) {'):
        lines[23] = lines[23].replace('(Array.isArray(data) {', '(Array.isArray(data)) {')

# Line 266: .json(maskFuelCardData(order) -> .json(maskFuelCardData(order))
if 265 < len(lines):
    if '.json(maskFuelCardData(order)' in lines[265]:
        lines[265] = lines[265].replace('.json(maskFuelCardData(order)', '.json(maskFuelCardData(order))')

# Line 289: .json(maskFuelCardData(contracts) -> .json(maskFuelCardData(contracts))
if 288 < len(lines):
    if '.json(maskFuelCardData(contracts)' in lines[288]:
        lines[288] = lines[288].replace('.json(maskFuelCardData(contracts)', '.json(maskFuelCardData(contracts))')

# Duplicate csrfProtection
# Lines 121, 256, 300
for i in [121, 256, 300]:
    idx = i - 1
    if idx < len(lines):
        lines[idx] = lines[idx].replace('csrfProtection,  csrfProtection,', 'csrfProtection,')

with open('api/src/routes/fuel-purchasing.routes.ts', 'w') as f:
    f.writelines(lines)
