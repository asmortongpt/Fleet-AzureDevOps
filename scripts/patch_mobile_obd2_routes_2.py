lines = open('api/src/routes/mobile-obd2.routes.ts').readlines()

for i in range(len(lines)):
    # Line 59 (approx):     })
    # Context: inside ReportDTCsSchema dtcs array
    # Previous line 58:     detected_at: z.string().datetime()
    # Next line 60: })
    
    # We want to change line 59 `  })` to `  }))`
    
    # Check if lines[i] is `  })` and lines[i+1] is `})`
    # Also index around 59
    if i == 59 and lines[i].strip() == "})":
         lines[i] = "  }))\n" # Close object AND array

with open('api/src/routes/mobile-obd2.routes.ts', 'w') as f:
    f.writelines(lines)
