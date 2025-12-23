lines = open('api/src/services/OcrService.ts').readlines()

# Line 242 (index 241): ); -> });
if ');' in lines[241]:
    lines[241] = lines[241].replace(');', '});')

# Line 244 (index 243): Insert }
if lines[243].strip() == '':
    lines[243] = '      }\n'

# Line 253 (index 252): Insert } for credentials
if lines[252].strip() == '':
    lines[252] = '          }\n'

# Line 254 (index 253): ); -> });
if ');' in lines[253]:
    lines[253] = lines[253].replace(');', '});')
    
# Line 256 (index 255): Insert } for if
if lines[255].strip() == '':
    lines[255] = '      }\n'

# Check Azure Vision (approx lines 260+)
# 260: this.azureVisionClient = ...
# 261:   new ApiKeyCredentials({
# 262:      inHeader: ...
# 263:   ),
# 264:   process.env...
# 265: );

# I need to see more lines to be sure about Azure part.
# But let's apply these fixes first.

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
