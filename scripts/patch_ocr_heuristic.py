import re

filepath = 'api/src/services/OcrService.ts'
with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Fix 1: Truncated object/block ends
    # Lines that differ only in whitespace vs ';'
    if re.match(r'^\s+;\s*$', line):
        # likely '    };' or '  }'
        # Check indentation
        indent = len(line) - len(line.lstrip())
        new_lines.append(' ' * indent + '}\n')
        continue

    # Fix 2: Missing '}' before catch
    if re.match(r'^\s+catch', line):
        # check previous line in new_lines
        if new_lines and not new_lines[-1].strip().endswith('}'):
            # Insert '}' with same indent as catch
            indent = len(line) - len(line.lstrip())
            new_lines.append(' ' * indent + '}\n')
    
    # Fix 3: Missing '}' before else
    if re.match(r'^\s+else', line):
        if new_lines and not new_lines[-1].strip().endswith('}'):
            indent = len(line) - len(line.lstrip())
            new_lines.append(' ' * indent + '}\n')
            
    # Fix 4: Missing '}' before private/public methods (which are not inside comments)
    # This is harder because 'private' can be inside constructor args.
    # Pattern: ^  private async ...
    if re.match(r'^  (private|public|async) ', line):
        # Top level methods usually indent 2
        # Check if previous line closes the previous method
        if new_lines and new_lines[-1].strip() != '}' and new_lines[-1].strip() != '{' and not new_lines[-1].strip().startswith('/**') and not new_lines[-1].strip().startswith('*') and not new_lines[-1].strip().startswith('//'):
            # Ignore empty lines
            last_code_line = ""
            for l in reversed(new_lines):
                if l.strip():
                    last_code_line = l
                    break
            
            if last_code_line and not last_code_line.strip().endswith('}') and not last_code_line.strip().endswith('{'):
                 new_lines.append('  }\n\n')

    # Fix 5: Missing '}' before export (interface/enum)
    if re.match(r'^export (interface|enum|class)', line):
         # Check previous
         last_code_line = ""
         for l in reversed(new_lines):
             if l.strip():
                 last_code_line = l
                 break
         
         if last_code_line and not last_code_line.strip().endswith('}') and not last_code_line.strip().startswith('/*') and not last_code_line.strip().startswith('*') and not last_code_line.strip().startswith('//'):
              if 'import' not in last_code_line and '/**' not in last_code_line:
                   new_lines.append('}\n\n')

    new_lines.append(line)

# Fix mismatched quotes at line 1078 (approx)
# WHERE document_id = $1',
# Since we might have shifted lines, we search for the content
final_lines = []
for line in new_lines:
    if "WHERE document_id = $1'," in line:
        line = line.replace("WHERE document_id = $1',", "WHERE document_id = $1`,").replace("WHERE document_id = $1`,", "WHERE document_id = $1',") # wait, correction
        # Original: ... = $1',
        # Goal: ... = $1',  (Wait, line 1078 has ' at end. Start was ` at 1074)
        # 1074: `SELECT ...
        # 1078: WHERE ... = $1',
        # It's mixed backtick start, single quote end.
        # Should be backtick end.
        line = line.replace("WHERE document_id = $1',", "WHERE document_id = $1`,")
    final_lines.append(line)

with open(filepath, 'w') as f:
    f.writelines(final_lines)
