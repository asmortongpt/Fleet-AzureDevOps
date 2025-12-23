lines = open('api/src/routes/mobile-assignment.routes.ts').readlines()

for i in range(len(lines)):
    # Line 476: if (!['approve', 'deny'].includes(action) { -> if (!['approve', 'deny'].includes(action)) {
    if "if (!['approve', 'deny'].includes(action) {" in lines[i]:
        lines[i] = lines[i].replace("if (!['approve', 'deny'].includes(action) {", "if (!['approve', 'deny'].includes(action)) {")

    # Line 568: approved')', -> approved')`,
    if "approved')'," in lines[i]:
        lines[i] = lines[i].replace("approved')',", "approved')`,")

    # Line 574: days``, -> days'`,
    # Wait, checking line content.
    # It might be `... INTERVAL '7 days``,` or similar.
    # Let's just find the line with "INTERVAL '7 days" and fix the end.
    if "INTERVAL '7 days" in lines[i]:
        # Expectation: end with ``,
        # It currently might end with `` `` `` ?
        # Actually simplest is to replace the whole line ending char.
        # But let's be specific.
        # The tool output showed: `... INTERVAL '7 days``,`
        # We want `... INTERVAL '7 days'`, `
        lines[i] = lines[i].replace("days``,", "days'`,")

    # Line 581: active'', -> active'`,
    if "lifecycle_state = 'active''," in lines[i]:
        lines[i] = lines[i].replace("lifecycle_state = 'active'',", "lifecycle_state = 'active'`,")

    # Line 588: active'', -> active'`,
    if "lifecycle_state = 'active''," in lines[i]: # Same pattern
        lines[i] = lines[i].replace("lifecycle_state = 'active'',", "lifecycle_state = 'active'`,")


with open('api/src/routes/mobile-assignment.routes.ts', 'w') as f:
    f.writelines(lines)
