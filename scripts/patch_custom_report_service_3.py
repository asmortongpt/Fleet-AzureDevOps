lines = open('api/src/services/custom-report.service.ts').readlines()

# Line 493: status = `completed`, -> status = 'completed',
if 492 < len(lines):
    if "status = `completed`," in lines[492]:
        lines[492] = lines[492].replace("status = `completed`,", "status = 'completed',")

# Line 511: status = `failed`, -> status = 'failed',
if 510 < len(lines):
    if "status = `failed`," in lines[510]:
        lines[510] = lines[510].replace("status = `failed`,", "status = 'failed',")

with open('api/src/services/custom-report.service.ts', 'w') as f:
    f.writelines(lines)
