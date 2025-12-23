lines = open('api/src/middleware/cache.ts').readlines()

# Line 160: res.setHeader(`X-Cache`, `HIT') -> res.setHeader('X-Cache', 'HIT')
if 159 < len(lines):
    if "res.setHeader(`X-Cache`, `HIT')" in lines[159]:
        lines[159] = "        res.setHeader('X-Cache', 'HIT')\n"

# Line 18: import logger from `../utils/logger` -> import logger from '../utils/logger'
if 17 < len(lines):
    if "import logger from `../utils/logger`" in lines[17]:
        lines[17] = "import logger from '../utils/logger'\n"

# Check for other similar issues
# Line 84: .join(`&`) -> Valid
# Line 104: parts.join(`|`) -> Valid
# Line 131: req.method !== `GET` -> Valid

with open('api/src/middleware/cache.ts', 'w') as f:
    f.writelines(lines)
