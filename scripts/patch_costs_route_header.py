lines = open('api/src/routes/costs.ts').readlines()

# Line 1: /** -> ''
if lines[0].strip() == '/**':
    lines[0] = ''

# Line 6:  * Cost Management Routes -> /**\n * Cost Management Routes
if lines[5].strip().startswith('* Cost Management Routes'):
    lines[5] = '/**\n' + lines[5]

# Line 8:  */ ->  */
# It is already closing the comment block if we started one at line 6.
# But wait, lines 6-8 are:
# 6:  * Cost Management Routes
# 7:  * Provides ...
# 8:  */

# So if I remove line 1, lines 2-5 become code.
# Then line 6 starts with *. JS allows division operator, but likely syntax error if not in comment.
# So I must ensure line 6 starts a comment block again.
# Or I can just comment out lines 6-8 properly?
# Current:
# 1: /**
# 2: import ...
# ...
# 6:  * Cost ...
# 8:  */

# If I make line 1 empty.
# Lines 2-5 are code.
# Line 6 is ` * Cost ...`. This is syntax error.
# So I need to insert `/**` before line 6?
# Or change line 6 to `/**\n * Cost ...`?

lines[0] = '' # Remove initial /**
# Lines 2-5 are fine.
# Line 6 (index 5)
lines[5] = '/**\n' + lines[5]

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
