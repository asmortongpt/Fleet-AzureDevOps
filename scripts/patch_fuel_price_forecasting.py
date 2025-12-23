lines = open('api/src/ml-models/fuel-price-forecasting.model.ts').readlines()

# Line 162: let reasoning = '` -> let reasoning = ''
if 161 < len(lines):
    if "let reasoning = '`" in lines[161] or "let reasoning = '`.strip()" in lines[161].strip():
         lines[161] = "      let reasoning = ''\n"
    elif "let reasoning = '`" in lines[161]: # Fallback check 
         lines[161] = lines[161].replace("'\\`", "''").replace("' `", "''").replace("'`", "''")
    # Actually just replace the whole line for safety if it matches pattern
    if "let reasoning =" in lines[161] and "`" in lines[161]:
        lines[161] = "      let reasoning = ''\n"

# Line 304: INTERVAL `${days} days` -> INTERVAL '${days} days'
if 303 < len(lines):
    if "INTERVAL `${days} days`" in lines[303]:
        lines[303] = lines[303].replace("INTERVAL `${days} days`", "INTERVAL '${days} days'")

with open('api/src/ml-models/fuel-price-forecasting.model.ts', 'w') as f:
    f.writelines(lines)
