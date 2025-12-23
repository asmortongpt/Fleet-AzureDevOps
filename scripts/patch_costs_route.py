lines = open('api/src/routes/costs.ts').readlines()

# Fix regex-like errors: })) -> })
# And: })) -> }) at end of blocks

for i, line in enumerate(lines):
    # e.g. return sortOrder === 'asc' ? -diff : diff } ))
    if line.strip().endswith('}))'):
        lines[i] = line.replace('}))', '})')
    # e.g. res.json({ ... }))
    if line.strip().endswith('}))'):
        lines[i] = line.replace('}))', '})')
    
    # Catch specific cases seen in view_file
    # line 76: })) -> })
    # line 81: })) -> })
    # line 88: })) -> })
    # line 115: })) -> })
    # line 118: })) -> })
    # line 120: })) -> })
    # line 177: })) -> })
    # line 180: })) -> })
    # line 182: })) -> })
    # line 201: })) -> })
    # line 204: })) -> })
    # line 250: })) -> })
    # line 263: })) -> })
    # line 266: })) -> })
    # line 299: })) -> })
    # line 302: })) -> })
    # line 325: })) -> })
    # line 328: })) -> })
    # line 357: })) -> })
    # line 360: })) -> })
    # line 374: })) -> })
    # line 404: })) -> })
    # line 413: })) -> })
    # line 418: })) -> })
    # line 438: })) -> })
    # line 443: })) -> })
    # line 446: })) -> })
    # line 456: })) -> })
    # line 488: })) -> })
    # line 495: })) -> })
    # line 500: })) -> })
    # line 503: })) -> })
    # line 521: })) -> })
    # line 524: })) -> })
    # line 581: })) -> })
    # line 584: })) -> })

    # Also check double parens inside
    if '}))' in line:
        lines[i] = line.replace('}))', '})')

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
