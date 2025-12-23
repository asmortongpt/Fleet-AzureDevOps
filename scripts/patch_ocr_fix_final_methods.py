lines = open('api/src/services/OcrService.ts').readlines()

# 1. getOcrResult
get_ocr_idx = -1
for i, line in enumerate(lines):
    if 'async getOcrResult' in line:
        get_ocr_idx = i
        break

if get_ocr_idx != -1:
    # 1a. db.query closer (approx +9 lines from start of query)
    # query starts ~1070
    for j in range(get_ocr_idx, get_ocr_idx+20):
        if '});' in lines[j] and j > get_ocr_idx + 5: # likely the query closer
             lines[j] = lines[j].replace('});', ');')
             break
    
    # 1b. if return null closer
    for j in range(get_ocr_idx, get_ocr_idx+20):
        if 'if (result.rows.length === 0) {' in lines[j]:
            if 'return null;' in lines[j+1]:
                if lines[j+2].strip() == '':
                    lines[j+2] = '      }\n'
            break
            
    # 1c. try block closer (before catch)
    for j in range(get_ocr_idx, get_ocr_idx+40):
        if 'catch (error) {' in lines[j]:
             # line j-1 is }
             if lines[j-1].strip() == '}':
                 lines[j-1] = '      };\n    }\n' # close obj, close try
             break

# 2. searchOcrResults
search_idx = -1
for i, line in enumerate(lines):
    if 'async searchOcrResults' in line:
        search_idx = i
        break

if search_idx != -1:
    # 2a. db.query closer
    for j in range(search_idx, search_idx+30):
        if '});' in lines[j] and j > search_idx + 5:
             lines[j] = lines[j].replace('});', ');')
             break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
