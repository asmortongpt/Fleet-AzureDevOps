lines = open('api/src/ml-models/cost-forecasting.model.ts').readlines()

# 1. Line 56: : '` -> : ''
replace_happened = False
if 55 < len(lines):
    if ": '`" in lines[55].strip() or ": `".strip() in lines[55].strip(): 
        # Line 56 is index 55. Content: : '`
        lines[55] = lines[55].replace("'`", "''").replace(":`", ": ''") 
        # The view showed: : '`
        # Wait, view:
        # 56:         : '`
        lines[55] = "        : ''\n"

# 2. Line 64: `month` -> 'month'
# Content: DATE_TRUNC(`month`, transaction_date)
if 63 < len(lines) and "`month`" in lines[63]:
    lines[63] = lines[63].replace("`month`", "'month'")

# 3. Line 68: `12 months` -> '12 months'
if 67 < len(lines) and "`12 months`" in lines[67]:
    lines[67] = lines[67].replace("`12 months`", "'12 months'")

with open('api/src/ml-models/cost-forecasting.model.ts', 'w') as f:
    f.writelines(lines)
