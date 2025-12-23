lines = open('api/src/routes/mobile-obd2.routes.ts').readlines()

for i in range(len(lines)):
    # Fix line 589: `    ))` -> `    )`
    # Context: inside /connection-log handler.
    # Check if lines[i] is `    ))` and surrounding context
    if lines[i].strip() == "))" and i > 580 and "connection-log" in "".join(lines[i-25:i]):
         lines[i] = "    )\n"
    
    # Fix duplicate csrfProtection at line 566 (approx)
    if "router.post('/connection-log',csrfProtection" in lines[i]:
        lines[i] = lines[i].replace("csrfProtection,  csrfProtection", "csrfProtection")

with open('api/src/routes/mobile-obd2.routes.ts', 'w') as f:
    f.writelines(lines)
