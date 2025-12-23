lines = open('api/src/routes/mobile-obd2.routes.ts').readlines()

for i in range(len(lines)):
    # Fix line 474: `    ))` -> `    )`
    # Context: inside /live-data handler.
    # Check if lines[i] is `    ))` and surrounding context
    if lines[i].strip() == "))" and i > 460 and "live-data" in "".join(lines[i-15:i]):
         lines[i] = "    )\n"
    
    # Fix duplicate csrfProtection at line 461 (approx)
    if "router.post('/live-data',csrfProtection" in lines[i]:
        lines[i] = lines[i].replace("csrfProtection,  csrfProtection", "csrfProtection")

with open('api/src/routes/mobile-obd2.routes.ts', 'w') as f:
    f.writelines(lines)
