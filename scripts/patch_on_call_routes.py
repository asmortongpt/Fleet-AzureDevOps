lines = open('api/src/routes/on-call-management.routes.ts').readlines()

for i in range(len(lines)):
    # Line 47: commuting_constraints: z.record(z.any().optional(), -> commuting_constraints: z.record(z.any().optional()),
    if "commuting_constraints: z.record(z.any().optional()," in lines[i]:
        lines[i] = lines[i].replace("commuting_constraints: z.record(z.any().optional(),", "commuting_constraints: z.record(z.any().optional()),")
    
    # Line 165: const countResult = await pool.query(countQuery, params.slice(0, -2) -> ... params.slice(0, -2))
    if "const countResult = await pool.query(countQuery, params.slice(0, -2)" in lines[i]:
        lines[i] = lines[i].replace("params.slice(0, -2)", "params.slice(0, -2))")

    # Line 174: pages: Math.ceil(total / parseInt(limit as string), -> ... parseInt(limit as string)),
    if "pages: Math.ceil(total / parseInt(limit as string)," in lines[i]:
         lines[i] = lines[i].replace("parseInt(limit as string),", "parseInt(limit as string)),")

with open('api/src/routes/on-call-management.routes.ts', 'w') as f:
    f.writelines(lines)
