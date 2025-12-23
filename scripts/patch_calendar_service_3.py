lines = open('api/src/services/calendar.service.ts').readlines()

# Line 639: You`re -> You're
for i in range(len(lines)):
    if "You`re" in lines[i]:
        lines[i] = lines[i].replace("You`re", "You're")

with open('api/src/services/calendar.service.ts', 'w') as f:
    f.writelines(lines)
