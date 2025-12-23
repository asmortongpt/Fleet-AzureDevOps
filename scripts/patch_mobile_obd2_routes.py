lines = open('api/src/routes/mobile-obd2.routes.ts').readlines()

for i in range(len(lines)):
    # Line 39 (approx): supported_protocols: z.array(z.string().optional(),
    if "supported_protocols: z.array(z.string().optional()," in lines[i]:
        # Assume usage meant array of strings, optional.
        # But text says `z.array(z.string().optional(),`
        # It ends with `,`.
        # I'll change it to `supported_protocols: z.array(z.string()).optional(),`
        lines[i] = "  supported_protocols: z.array(z.string()).optional(),\n"

    # Line 318 (approx):     )
    # This closes map. But we need to close reportDiagnosticCodes call.
    # Check context:
    # 309: const dtcs = await obd2Service.reportDiagnosticCodes(
    # ...
    # 318:     )
    # 319: 
    # 320:     res.status(201).json(dtcs)
    
    # We can detect if line 318 is `    )` and line 319 is empty or next line is code.
    # And specifically inside `router.post('/dtcs', ...`
    
    if i == 318 and lines[i].strip() == ")":
        # Add another )
        lines[i] = "    ))\n" # Close map AND function call

with open('api/src/routes/mobile-obd2.routes.ts', 'w') as f:
    f.writelines(lines)
