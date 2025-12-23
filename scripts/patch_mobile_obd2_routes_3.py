lines = open('api/src/routes/mobile-obd2.routes.ts').readlines()

# Line 59 (index 58):   })
# Line 60 (index 59):   }))

# We want:
# Line 59:   })),
# Line 60: })

if len(lines) > 60:
    lines[58] = "  })),\n"
    lines[59] = "})\n"

with open('api/src/routes/mobile-obd2.routes.ts', 'w') as f:
    f.writelines(lines)
