lines = open('api/src/services/OcrService.ts').readlines()

# Look for TXT = ...
for i, line in enumerate(lines):
    if "TXT = 'text/plain'," in line:
        # Check next lines
        if i+2 < len(lines):
            # i+1 is } (possibly indented)
            # i+2 is CSV = ...
            if '}' in lines[i+1] and "CSV = 'text/csv'" in lines[i+2]:
                # Rearrange
                lines[i+1] = "  CSV = 'text/csv'\n"
                lines[i+2] = "}\n"
                break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
