lines = open('api/src/services/OcrService.ts').readlines()

# Line 437 (index 436): ); -> });
if ');' in lines[436]:
    lines[436] = lines[436].replace(');', '});')

# Line 457 (index 456): Insert } for metadata
if lines[456].strip() == '':
    lines[456] = '      }\n'

# Line 458 (index 457): } -> };
if lines[457].strip() == '}':
    lines[457] = '    };\n'

# Line 459 (index 458): Insert } for method
if lines[458].strip() == '':
    lines[458] = '  }\n'

# Line 481 (index 480): Append } for boundingBox
if 'boundingBox' in lines[480] and not lines[480].strip().endswith('}'):
    lines[480] = lines[480].rstrip() + ' }\n'

# Line 482 (index 481): ], -> }],
if '],' in lines[481]:
    lines[481] = lines[481].replace('],', '}],')

# Line 495 (index 494): Insert } for metadata
if lines[494].strip() == '':
    lines[494] = '      }\n'

# Line 496 (index 495): } -> };
if lines[495].strip() == '}':
    lines[495] = '    };\n'

# Line 497 (index 496): Insert } for method
if lines[496].strip() == '':
    lines[496] = '  }\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
