lines = open('api/src/routes/langchain.routes.ts').readlines()

# Line 233:       }) ->       }))
if 232 < len(lines):
    if "      })" in lines[232]:
        lines[232] = lines[232].replace("      })", "      }))")

# Duplicate csrfProtection
# Lines 30, 98, 181, 569
for i in [30, 98, 181, 569]:
    idx = i - 1
    if idx < len(lines):
        lines[idx] = lines[idx].replace('csrfProtection,  csrfProtection,', 'csrfProtection,')

with open('api/src/routes/langchain.routes.ts', 'w') as f:
    f.writelines(lines)
