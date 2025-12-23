import re

with open('api/src/repositories/push-notification.repository.ts', 'r') as f:
    content = f.read()

# 1. Change pool property to allow undefined or make it getter
# But since TS property is `private pool: Pool;`.
# We'll just remove the initialization in constructor that throws.
# And replace `this.pool` usage with `this.getDbPool()` or similar.

# Step 1: Modify constructor
# Old:
#   constructor(@inject(TYPES.DatabasePool) pool?: Pool) {
#     this.pool = pool || connectionManager.getPool();
#   }

# New:
#   constructor(@inject(TYPES.DatabasePool) pool?: Pool) {
#     if (pool) this.pool = pool;
#   }
#   private get db(): Pool {
#     return this.pool || connectionManager.getPool();
#   }
#   And replace `this.pool` with `this.db` in methods?
#   Wait, `this.pool` is defined as `private pool: Pool`. We should change it to `private pool?: Pool`.

# Let's replace the class definition start and constructor.

new_class_start = """@injectable()
export class PushNotificationRepository {
  private _pool?: Pool;

  constructor(@inject(TYPES.DatabasePool) pool?: Pool) {
    this._pool = pool;
  }

  private get pool(): Pool {
    return this._pool || connectionManager.getPool();
  }
"""

# Regex to replace class start and constructor
# Matches:
# @injectable()
# export class PushNotificationRepository {
#   private pool: Pool;
# 
#   constructor(@inject(TYPES.DatabasePool) pool?: Pool) {
#     this.pool = pool || connectionManager.getPool();
#   }

pattern = r"@injectable\(\)\s+export class PushNotificationRepository \{\s+private pool: Pool;\s+constructor\(@inject\(TYPES\.DatabasePool\) pool\?: Pool\) \{\s+this\.pool = pool \|\| connectionManager\.getPool\(\);\s+\}"

if re.search(pattern, content):
    content = re.sub(pattern, new_class_start, content)
else:
    # Fallback if whitespace differs
    print("Pattern match failed, trying looser match")
    # Just replace constructor line which is the offender.
    # `this.pool = pool || connectionManager.getPool();` -> `this._pool = pool;`
    # And `private pool: Pool;` -> `private _pool?: Pool;`
    # And add the getter.
    
    content = content.replace("private pool: Pool;", "private _pool?: Pool;")
    content = content.replace("this.pool = pool || connectionManager.getPool();", "this._pool = pool;")
    
    # Add getter after constructor
    getter = """
  private get pool(): Pool {
    return this._pool || connectionManager.getPool();
  }"""
    content = content.replace("}", "}" + getter, 1) # Insert after first closing brace which is constructor's (hopefully)
    # Actually, simpler to just replace `this.pool` with `this.db` everywhere is hard.
    # But if I define `get pool()` property, `this.pool` access works as getter!
    # So I just need to:
    # 1. Rename property `pool` to `_pool`
    # 2. Add `get pool()` that returns `_pool` or `connectionManager.getPool()`.
    
    # But wait, `this.pool` access inside the class will use the getter? Yes.
    pass

# Re-implementing the robust replacement
lines = content.split('\n')
new_lines = []
for line in lines:
    if "private pool: Pool;" in line:
        new_lines.append("  private _pool?: Pool;")
    elif "this.pool = pool || connectionManager.getPool();" in line:
        new_lines.append("    this._pool = pool;")
    elif "constructor(@inject(TYPES.DatabasePool) pool?: Pool) {" in line:
        new_lines.append(line)
        # We need to inject the getter after the constructor
    elif "}" in line and "this._pool = pool;" in "".join(new_lines[-3:]): 
        # Closing brace of constructor
        new_lines.append(line)
        new_lines.append("")
        new_lines.append("  private get pool(): Pool {")
        new_lines.append("    return this._pool || connectionManager.getPool();")
        new_lines.append("  }")
    else:
        new_lines.append(line)

with open('api/src/repositories/push-notification.repository.ts', 'w') as f:
    f.write('\n'.join(new_lines))
