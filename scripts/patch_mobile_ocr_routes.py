lines = open('api/src/routes/mobile-ocr.routes.ts').readlines()

for i in range(len(lines)):
    line = lines[i]
    
    # Fix 43: if (allowedTypes.includes(file.mimetype) {
    if "if (allowedTypes.includes(file.mimetype) {" in line:
        lines[i] = "    if (allowedTypes.includes(file.mimetype)) {\n"

    # Fix 46: cb(new Error(`Unsupported file type: ${file.mimetype}`);
    if "cb(new Error(`Unsupported file type: ${file.mimetype}`);" in line:
        lines[i] = "      cb(new Error(`Unsupported file type: ${file.mimetype}`));\n"

    # Fix 66: confidenceScores: z.record(z.number().optional(),
    if "confidenceScores: z.record(z.number().optional()," in line:
        lines[i] = "      confidenceScores: z.record(z.number().optional()),\n"

    # Fix 87: data: z.record(z.any(),
    if "data: z.record(z.any()," in line:
        lines[i] = "  data: z.record(z.any()),\n"
        
    # Fix 97: duplicate csrfProtection
    if "router.post(" in line and "csrfProtection,  csrfProtection" in lines[i+2] if i+2 < len(lines) else False:
         # Need to handle multi-line router.post?
         pass
    
    if "csrfProtection,  csrfProtection" in line:
        lines[i] = line.replace("csrfProtection,  csrfProtection", "csrfProtection")

    # Fix 442: }); -> }));
    if i == 441 and lines[i].strip() == "});":
         # Context check: line 439 has map
         lines[i] = "            }));\n"

    # Fix 465: }); -> }));
    if i == 464 and lines[i].strip() == "});":
         lines[i] = "            }));\n"

    # Fix 504: dynamic columns
    # 504: SELECT ' + (await getTableColumns ...
    if "await getTableColumns(pool" in line:
         lines[i] = "        SELECT * FROM mobile_ocr_captures\n"

with open('api/src/routes/mobile-ocr.routes.ts', 'w') as f:
    f.writelines(lines)
