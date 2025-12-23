lines = open('api/src/routes/mobile-hardware.routes.ts').readlines()

for i in range(len(lines)):
    # Line 87: if (validated.barcode.includes('NOTFOUND') { -> if (validated.barcode.includes('NOTFOUND')) {
    if "if (validated.barcode.includes('NOTFOUND') {" in lines[i]:
        lines[i] = lines[i].replace("if (validated.barcode.includes('NOTFOUND') {", "if (validated.barcode.includes('NOTFOUND')) {")

    # Line 798: }) -> })) (only if followed by "})")
    # Actually, we can check if line 794 starts z.array and line 798 is just "  })".
    # Wait, simple text replacement might be risky if "  })" appears elsewhere.
    # But indentation helps.
    if i == 797 and lines[i].strip() == "})": # 0-indexed, so 798 is lines[797]
        lines[i] = lines[i].replace("})", "}))")

    # Or simply search for the context
    if "unitPrice: z.number().min(0)" in lines[i-1] and lines[i].strip() == "})":
        lines[i] = lines[i].replace("})", "}))")

with open('api/src/routes/mobile-hardware.routes.ts', 'w') as f:
    f.writelines(lines)
