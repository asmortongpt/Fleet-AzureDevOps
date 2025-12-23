lines = open('api/src/services/OcrService.ts').readlines()

# 1. 1008, 1023: return { ... ; -> };
if 'return { x: 0' in lines[1007] and lines[1007].strip().endswith(';'):
    lines[1007] = lines[1007].replace(';', '};')

if 'return { x: 0' in lines[1022] and lines[1022].strip().endswith(';'):
    lines[1022] = lines[1022].replace(';', '};')

# 2. Restore SQL backticks
# Block 1
if lines[1039].strip() == "'INSERT INTO ocr_results (":
    lines[1039] = lines[1039].replace("'", "`")

if lines[1055].strip() == "updated_at = NOW()',":
    lines[1055] = lines[1055].replace("',", "`,")

# Block 2
if lines[1083].strip().startswith("'SELECT document_id"):
    lines[1083] = lines[1083].replace("'", "`")

if lines[1087].strip() == "WHERE document_id = $1',":
    lines[1087] = lines[1087].replace("',", "`,")

# Block 3
if lines[1121].strip() == "'SELECT":
    lines[1121] = lines[1121].replace("'", "`")

if lines[1135].strip() == "LIMIT $3',":
    lines[1135] = lines[1135].replace("',", "`,")


# 3. Close methods
# 1076 (index 1075)
if lines[1075].strip() == '':
    lines[1075] = '  }\n'

# 1114 (index 1113)
if lines[1113].strip() == '':
    lines[1113] = '  }\n'

# 1146 (index 1145)
if lines[1145].strip() == '':
    lines[1145] = '  }\n'

# 4. Close Class
# Before export default (1159)
# Insert } at 1157?
if lines[1156].strip() == '':
    lines[1156] = '}\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
