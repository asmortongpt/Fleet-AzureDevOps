lines = open('api/src/routes/costs.ts').readlines()

# Line 304 (closes 271): })); -> });
# 271: router.get('/budget/alerts', async (_req, res) => {
# This needs });
if lines[303].strip() == '}));':
    lines[303] = lines[303].replace('}));', '});')

# Line 376 (closes 365 export): })); -> });
# 365: router.get('/export', async (_req, res) => {
# Check if 375/376 is close
# Previous view showed export closes around 376
if len(lines) > 375 and '}));' in lines[375]:
    lines[375] = lines[375].replace('}));', '});')
if len(lines) > 375 and lines[375].strip() == '}))':
    lines[375] = lines[375].replace('}))', '});')

# Line 521 (closure for forecast, 508): 
# 508: router.get('/forecast', async (_req, res) => {
# Closure around 521?
# Let's be safer and check lines around there.
def fix_closure_if_needed(line_idx):
    if line_idx < len(lines):
        line = lines[line_idx].strip()
        if line == '}));' or line == '}))':
             lines[line_idx] = lines[line_idx].replace('}))', '})')

# 304 is fixed explicitly above.
# 376 (index 375)
fix_closure_if_needed(375)
# 521 (index 520)
fix_closure_if_needed(520)
# 586 (dashboard closes around here? 529 start)
# dashboard is long.
# Let's rely on finding `async (_req` vs `asyncHandler`
# Instead of guessing indices, let's look for blocks.

# Strategy:
# 1. Find all router.get/post/put/delete lines.
# 2. Check if they use asyncHandler.
# 3. Find their matching closing brace (simple counter).
# 4. Ensure closure matches.

# Since I can't run complex logic easily in one go without errors, I'll target specific known lines from my viewing.
# 304 is confirmed.
# 376 (Export) I should verify.
# 521 (Forecast) I should verify.
# 586 (Dashboard) I should verify.

# I'll just fix 304 for now to unblock, and then check the next error. 
# Safe approach.

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
