lines = open('api/src/routes/mobile-notifications.routes.ts').readlines()

# Add logger import if missing
has_logger = any("import { logger }" in line for line in lines)
if not has_logger:
    # Insert after imports
    for i, line in enumerate(lines):
        if line.strip().startswith("import") and not lines[i+1].strip().startswith("import"):
             lines.insert(i+1, "import { logger } from '../utils/logger';\n")
             break

for i in range(len(lines)):
    # Fix line 596 (approx): duplicate csrfProtection and asyncHandler
    if "router.post('/webhooks/twilio'" in lines[i]:
        # Replace entire line or specific parts
        # Original: router.post('/webhooks/twilio',csrfProtection,  csrfProtection, asyncHandler(async (req, res) => {
        # Target: router.post('/webhooks/twilio', csrfProtection, async (req, res) => {
        lines[i] = "router.post('/webhooks/twilio', csrfProtection, async (req, res) => {\n"
    
    # Fix closing of asyncHandler at line 605 (approx)
    if lines[i].strip() == "}));":
        # Check if it matches the block we opened at 596
        # Assuming only one matching block like this
        if i > 590:
             lines[i] = "});\n"

with open('api/src/routes/mobile-notifications.routes.ts', 'w') as f:
    f.writelines(lines)
