lines = open('api/src/services/queue.service.ts').readlines()

# Line 608: 'SELECT -> `SELECT
if "const result = await pool.query(" in lines[606] or lines[607]: # 607 approx
    # 608 is the query start
    if "'SELECT" in lines[608] or "'SELECT " in lines[608].strip():
        lines[608] = lines[608].replace("'SELECT", "`SELECT")

# Line 625: ... FALSE', -> ... FALSE`,
if "FROM dead_letter_queue" in lines[625] or "FALSE'" in lines[625]:
    lines[625] = lines[625].replace("FALSE'", "FALSE`")

with open('api/src/services/queue.service.ts', 'w') as f:
    f.writelines(lines)
