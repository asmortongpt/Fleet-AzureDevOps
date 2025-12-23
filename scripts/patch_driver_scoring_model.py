lines = open('api/src/ml-models/driver-scoring.model.ts').readlines()

# Line 270: period_end = $3', -> period_end = $3`,
if 269 < len(lines):
    if "period_end = $3'," in lines[269]:
        lines[269] = lines[269].replace("period_end = $3',", "period_end = $3`,")

with open('api/src/ml-models/driver-scoring.model.ts', 'w') as f:
    f.writelines(lines)
