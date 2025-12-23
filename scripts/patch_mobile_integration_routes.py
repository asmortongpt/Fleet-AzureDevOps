lines = open('api/src/routes/mobile-integration.routes.ts').readlines()

for i in range(len(lines)):
    # lines 45-48: z.array(z.any().optional(), -> z.array(z.any().optional()),
    if "z.array(z.any().optional()," in lines[i]:
        lines[i] = lines[i].replace("z.array(z.any().optional(),", "z.array(z.any().optional()),")
    
    # Line 48: z.array(z.any().optional() -> z.array(z.any().optional()) (without comma)
    if "z.array(z.any().optional()" in lines[i] and not lines[i].strip().endswith("),"):
        lines[i] = lines[i].replace("z.array(z.any().optional()", "z.array(z.any().optional())")

    # Line 86: ai_detections: z.array(z.any(), -> ai_detections: z.array(z.any()),
    if "ai_detections: z.array(z.any()," in lines[i]:
          lines[i] = lines[i].replace("ai_detections: z.array(z.any(),", "ai_detections: z.array(z.any()),")

    # Line 480: if (isNaN(latitude) || isNaN(longitude) { -> if (isNaN(latitude) || isNaN(longitude)) {
    if "if (isNaN(latitude) || isNaN(longitude) {" in lines[i]:
        lines[i] = lines[i].replace("if (isNaN(latitude) || isNaN(longitude) {", "if (isNaN(latitude) || isNaN(longitude)) {")

with open('api/src/routes/mobile-integration.routes.ts', 'w') as f:
    f.writelines(lines)
