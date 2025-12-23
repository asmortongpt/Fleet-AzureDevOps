lines = open('api/src/routes/assignment-reporting.routes.ts').readlines()

# Line 76: ELSE `No` END -> ELSE 'No' END
if 75 < len(lines):
    if "ELSE `No` END" in lines[75]:
        lines[75] = lines[75].replace("ELSE `No` END", "ELSE 'No' END")

# Line 223: || ` ` || -> || ' ' ||
if 222 < len(lines):
    if "|| ` ` ||" in lines[222]:
        lines[222] = lines[222].replace("|| ` ` ||", "|| ' ' ||")

# Line 401: || ` ` || -> || ' ' ||
if 400 < len(lines):
    if "|| ` ` ||" in lines[400]:
        lines[400] = lines[400].replace("|| ` ` ||", "|| ' ' ||")

# Line 506: csrfProtection,  csrfProtection, -> csrfProtection,
if 505 < len(lines):
    if "csrfProtection,  csrfProtection," in lines[505]:
        lines[505] = lines[505].replace("csrfProtection,  csrfProtection,", "csrfProtection,")

with open('api/src/routes/assignment-reporting.routes.ts', 'w') as f:
    f.writelines(lines)
