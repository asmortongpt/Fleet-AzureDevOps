lines = open('api/src/server.ts').readlines()

# Add log before app.listen
for i in range(len(lines)):
    if "const server = app.listen(PORT" in lines[i]:
        lines.insert(i, "console.log('--- READY TO LISTEN ON PORT ' + PORT + ' ---');\n")
        break

# Add log after imports (approximate)
# Look for 'const app = express()'
for i in range(len(lines)):
    if "const app = express()" in lines[i]:
        lines.insert(i, "console.log('--- IMPORTS COMPLETED, CREATING APP ---');\n")
        break

with open('api/src/server.ts', 'w') as f:
    f.writelines(lines)
