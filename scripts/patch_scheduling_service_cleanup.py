lines = open('api/src/services/scheduling.service.ts').readlines()

# Remove lines 862-872 (inclusive, approximately)
# Look for "export default {" and "}"
start_idx = -1
end_idx = -1

for i in range(len(lines)):
    if "export default {" in lines[i]:
        start_idx = i
    if start_idx != -1 and "}" in lines[i] and i > start_idx:
        end_idx = i
        # Check if this "}" is the one closing the object.
        # The object content is indented. The closing brace should be indented or not.
        # But wait, line 874 is "}". line 872 is "}".
        # Let's rely on content.
        if "getVehicleSchedule" in lines[i-1]: # heuristic
             pass

# Actually, simply filtering out the lines is safer if I know the exact content.
new_lines = []
skip = False
for line in lines:
    if "export default {" in line and "checkVehicleConflicts" in lines[lines.index(line)+1]:
        skip = True
    
    if skip and "getVehicleSchedule" in line:
        # This is the last item in the object
        pass

    if skip and line.strip() == "}":
        # This closes the export object
        skip = False
        continue # Don't add the closing brace of the removed block

    if not skip:
        new_lines.append(line)

# Wait, the logic above is a bit brittle.
# Let's just delete the range if found.
lines = open('api/src/services/scheduling.service.ts').readlines()
final_lines = []
in_bad_block = False
for i, line in enumerate(lines):
    if line.strip() == "export default {" and "checkVehicleConflicts" in lines[i+1]:
        in_bad_block = True
    
    if in_bad_block:
        if line.strip() == "}" and "getVehicleSchedule" in lines[i-1]: # Close of the object
             in_bad_block = False
             continue # Skip the }
        continue # Skip content
    
    final_lines.append(line)

with open('api/src/services/scheduling.service.ts', 'w') as f:
    f.writelines(final_lines)
