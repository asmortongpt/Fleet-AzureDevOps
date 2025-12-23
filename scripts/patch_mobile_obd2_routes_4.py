lines = open('api/src/routes/mobile-obd2.routes.ts').readlines()

for i in range(len(lines)):
    # Line 318 (approx):     )
    # Check context: next line 320 (skip 319 empty) starts with res.status
    if lines[i].strip() == ")" and i + 2 < len(lines) and "res.status(201)" in lines[i+2]:
        lines[i] = "    ))\n"
    
    # Also check i+1 if there is no empty line
    if lines[i].strip() == ")" and i + 1 < len(lines) and "res.status(201)" in lines[i+1]:
        lines[i] = "    ))\n"

    # Fix duplicate csrfProtection at line 303 (approx)
    if "router.post('/dtcs',csrfProtection" in lines[i]:
        lines[i] = lines[i].replace("csrfProtection,  csrfProtection", "csrfProtection")

with open('api/src/routes/mobile-obd2.routes.ts', 'w') as f:
    f.writelines(lines)
