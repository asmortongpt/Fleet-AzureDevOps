lines = open('api/src/routes/mobile-hardware.routes.ts').readlines()

# Line 849: }) -> })) (closing map)
# This is tricky because "})" is common.
# Let's rely on context.
for i in range(len(lines)):
    # Check if lines[i] is "    })" and previous lines look like object properties
    if lines[i].strip() == "})" and "addedAt" in lines[i-1]:
        lines[i] = lines[i].replace("})", "}))")

with open('api/src/routes/mobile-hardware.routes.ts', 'w') as f:
    f.writelines(lines)
