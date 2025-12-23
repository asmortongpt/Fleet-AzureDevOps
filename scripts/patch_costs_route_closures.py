lines = open('api/src/routes/costs.ts').readlines()

# Line 120: }) -> }))
if lines[119].strip() == '})':
    lines[119] = lines[119].replace('})', '}))')

# But wait, looking at file view:
# 119:   }
# 120: })
# It should be closing router.get(..., asyncHandler(...))
# So it needs to be }))

# Let's check other block ends too
# Line 182: })) -> })  was patched. If it was router.get it needs to be }))
# This implies my previous patch might have been too aggressive removing ALL double parens?

# Revert specific router.get/post closers
def check_router_closer(idx):
    if idx < len(lines):
        if lines[idx].strip() == '})':
            lines[idx] = lines[idx].replace('})', '}))')

# Inspect known router handler ends based on previous error log or typical structure
# Line 120
check_router_closer(119) # index 119 is line 120? No view says line 120 is })
# Line 120 in view is index 119 in 0-indexed list?
# View: 
# 119:   }
# 120: }) 
# So index 119 is })

if lines[119].strip() == '})':
    lines[119] = lines[119].replace('})', '}))')

# Similarly for others?
# We have many routes. 
# 182, 206, 268, 304, 330, 362, 376, 448, 505, 526, 586
indices = [181, 205, 267, 303, 329, 361, 375, 447, 504, 525, 585]
for idx in indices:
    if idx < len(lines) and lines[idx].strip() == '})':
        lines[idx] = lines[idx].replace('})', '}))')

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
