lines = open('api/src/services/OcrService.ts').readlines()

# Corrections map: line_index (0-based) -> action
# Insert '}' before the line
insertions = [
    43, 52, 61, 69, 76, 83, # catch blocks
    95, 107, # enums
    116, 123, 130, 140, 148, 155, 163, # interfaces
    184, 196, # interfaces
    206, # constructor
    247, # catch
    308, # catch
]

# Sort reverse to avoid index shift
insertions.sort(reverse=True)

for idx in insertions:
    lines.insert(idx, '  }\n')

# Specific fixes
# Line 185 (orig) was ';' -> '}'
# Line 312, 313 -> '}'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
