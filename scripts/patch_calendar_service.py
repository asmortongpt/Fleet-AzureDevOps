lines = open('api/src/services/calendar.service.ts').readlines()

# 1. Move lines 11-66 outside the class.
# Find index of "export class CalendarService {"
class_def_idx = -1
for i, line in enumerate(lines):
    if "export class CalendarService {" in line:
        class_def_idx = i
        break

# Find index of "// Azure AD Configuration"
start_block_idx = -1
for i, line in enumerate(lines):
    if "// Azure AD Configuration" in line:
        start_block_idx = i
        break

# Find index of "async createEvent("
end_block_idx = -1
for i, line in enumerate(lines):
    if "async createEvent(" in line:
        end_block_idx = i
        break

# We want to move everything from start_block_idx up to (but not including) the comment block before createEvent.
# The comment block starts at end_block_idx - 3 (approx).
# Let's find "/**" before createEvent
comment_start = -1
for i in range(end_block_idx, 0, -1):
    if "/**" in lines[i]:
        comment_start = i
        break

if class_def_idx != -1 and start_block_idx != -1 and comment_start != -1:
    # Ensure start_block_idx is AFTER class_def_idx (confirming it's inside)
    if start_block_idx > class_def_idx:
        block_to_move = lines[start_block_idx:comment_start]
        # Remove from original location
        del lines[start_block_idx:comment_start]
        # Insert before class definition
        for line in reversed(block_to_move):
            lines.insert(class_def_idx, line)

# 2. Fix syntax errors
for i in range(len(lines)):
    # Line 14: || '`, -> || '',
    if "|| '`," in lines[i]:
        lines[i] = lines[i].replace("|| '`,", "|| '',")
        
    # Line 15: || `` -> || ''
    if "|| ``" in lines[i]:
        lines[i] = lines[i].replace("|| ``", "|| ''")

    # Line 265: WHERE event_id = $1', -> WHERE event_id = $1`,
    if "WHERE event_id = $1'," in lines[i]:
        lines[i] = lines[i].replace("WHERE event_id = $1',", "WHERE event_id = $1`,")

    # Line 505: WHERE event_id = $2', -> WHERE event_id = $2`,
    if "WHERE event_id = $2'," in lines[i]:
        lines[i] = lines[i].replace("WHERE event_id = $2',", "WHERE event_id = $2`,")

    # Line 545: WHERE id = $1 AND role = $2', -> WHERE id = $1 AND role = $2`,
    if "WHERE id = $1 AND role = $2'," in lines[i]:
         lines[i] = lines[i].replace("WHERE id = $1 AND role = $2',", "WHERE id = $1 AND role = $2`,")
         
    # Line 642: </p>' : ''} -> </p>` : ''}
    if "</p>' : ''}" in lines[i]:
        lines[i] = lines[i].replace("</p>' : ''}", "</p>` : ''}")

with open('api/src/services/calendar.service.ts', 'w') as f:
    f.writelines(lines)
