lines = open('api/src/services/OcrService.ts').readlines()

# Scan for resolve({
resolve_idx = -1
for i, line in enumerate(lines):
    if 'resolve({' in line:
        resolve_idx = i
        break

if resolve_idx != -1:
    # Look for metadata: {
    meta_idx = -1
    for i in range(resolve_idx, len(lines)):
        if 'metadata: {' in lines[i]:
            meta_idx = i
            break
            
    if meta_idx != -1:
        # Find processedAt
        processed_at_idx = -1
        for i in range(meta_idx, len(lines)):
            if 'processedAt' in lines[i]:
                processed_at_idx = i
                break
        
        if processed_at_idx != -1:
            # Overwrite lines after processedAt
            # 621 is processedAt
            # 622: }
            # 623: });
            # 624: });
            
            # Ensure processedAt line ends properly (no })
            # lines[processed_at_idx]
            
            # Rewrite closures
            # We explicitly set values based on view
            lines[processed_at_idx+1] = '          }\n' # Close metadata
            lines[processed_at_idx+2] = '        });\n' # Close resolve
            lines[processed_at_idx+3] = '      });\n' # Close worker.on(message)

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
