lines = open('api/src/services/driver-scorecard.service.ts').readlines()

# Line 214: GROUP BY d.id', -> GROUP BY d.id`,
if 213 < len(lines):
    if "GROUP BY d.id'," in lines[213]:
        lines[213] = lines[213].replace("GROUP BY d.id',", "GROUP BY d.id`,")

# Line 230: GROUP BY d.id', -> GROUP BY d.id`,
if 229 < len(lines):
    if "GROUP BY d.id'," in lines[229]:
        lines[229] = lines[229].replace("GROUP BY d.id',", "GROUP BY d.id`,")

# Line 246: GROUP BY d.id', -> GROUP BY d.id`,
if 245 < len(lines):
    if "GROUP BY d.id'," in lines[245]:
        lines[245] = lines[245].replace("GROUP BY d.id',", "GROUP BY d.id`,")

# Line 311: || ` ` || -> || ' ' ||
if 310 < len(lines):
    if "|| ` ` ||" in lines[310]:
        lines[310] = lines[310].replace("|| ` ` ||", "|| ' ' ||")

# Lines 367-369: Fix multiline string and nested backticks
if 366 < len(lines):
    # Old: `SELECT ` + (await getTableColumns(pool, `driver_achievements`)).join(', ') + ' FROM driver_achievements
    # New: `SELECT ` + (await getTableColumns(pool, 'driver_achievements')).join(', ') + ` FROM driver_achievements
    if "' FROM driver_achievements" in lines[366]:
        lines[366] = lines[366].replace("' FROM driver_achievements", "` FROM driver_achievements")
        lines[366] = lines[366].replace("`driver_achievements`", "'driver_achievements'")

if 368 < len(lines):
    # Old: ORDER BY earned_at DESC',
    # New: ORDER BY earned_at DESC`,
    if "ORDER BY earned_at DESC'," in lines[368]:
        lines[368] = lines[368].replace("ORDER BY earned_at DESC',", "ORDER BY earned_at DESC`,")

with open('api/src/services/driver-scorecard.service.ts', 'w') as f:
    f.writelines(lines)
