lines = open('api/src/services/OcrService.ts').readlines()

def escape_sql_line(line):
    # Remove existing wrappers if any
    clean = line.strip()
    if clean.startswith('`'): clean = clean[1:]
    if clean.endswith('`'): clean = clean[:-1]
    if clean.endswith('`,') or clean.endswith("',"): clean = clean[:-2]
    
    # Escape single quotes
    clean = clean.replace("'", "\\'")
    return clean

# Block 1: 1040-1056
# Start: INSERT INTO ocr_results (
# End: updated_at = NOW()
start_1 = -1
end_1 = -1
for i, line in enumerate(lines):
    if 'INSERT INTO ocr_results (' in line:
        start_1 = i
    if 'updated_at = NOW()' in line and start_1 != -1 and i > start_1:
        end_1 = i
        break

if start_1 != -1 and end_1 != -1:
    for j in range(start_1, end_1 + 1):
        clean = escape_sql_line(lines[j])
        suffix = " ' +" if j < end_1 else "',"
        prefix = "        '"
        lines[j] = prefix + clean + suffix + "\n"


# Block 2: 1084-1088
# Start: SELECT document_id, provider
# End: WHERE document_id = $1
start_2 = -1
end_2 = -1
for i, line in enumerate(lines):
    if 'SELECT document_id, provider' in line:
        start_2 = i
    if 'WHERE document_id = $1' in line and start_2 != -1 and i > start_2:
        end_2 = i
        break

if start_2 != -1 and end_2 != -1:
    for j in range(start_2, end_2 + 1):
        clean = escape_sql_line(lines[j])
        suffix = " ' +" if j < end_2 else "',"
        prefix = "        '"
        lines[j] = prefix + clean + suffix + "\n"

# Block 3: 1122-1136
# Start: SELECT
# End: LIMIT $3
start_3 = -1
end_3 = -1
for i, line in enumerate(lines):
    if 'SELECT' == lines[i].strip() or '`SELECT' == lines[i].strip(): # might be line 1121/1122
        start_3 = i
    if 'LIMIT $3' in line and start_3 != -1 and i > start_3:
        end_3 = i
        break

if start_3 != -1 and end_3 != -1:
    for j in range(start_3, end_3 + 1):
        clean = escape_sql_line(lines[j])
        suffix = " ' +" if j < end_3 else "',"
        prefix = "        '"
        lines[j] = prefix + clean + suffix + "\n"

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
