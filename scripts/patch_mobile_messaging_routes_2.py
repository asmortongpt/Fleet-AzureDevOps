lines = open('api/src/routes/mobile-messaging.routes.ts').readlines()

# Line 93: }) -> })) (closing map)
# Context: line 92 `contentBytes: '', ...`
for i in range(len(lines)):
    if lines[i].strip() == "})" and "contentBytes: ''" in lines[i-1]:
        lines[i] = lines[i].replace("})", "}))")

with open('api/src/routes/mobile-messaging.routes.ts', 'w') as f:
    f.writelines(lines)
