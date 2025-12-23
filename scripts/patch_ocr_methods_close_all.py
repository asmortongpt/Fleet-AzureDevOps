lines = open('api/src/services/OcrService.ts').readlines()

# Helper to find lines by content
def find_line_with_content(content, start_idx=0):
    for i in range(start_idx, len(lines)):
        if content in lines[i]:
            return i
    return -1

# 1. Google Vision (approx 686)
# Look for private async processWithAWSTextract
aws_start = find_line_with_content('private async processWithAWSTextract')
if aws_start != -1:
    # Go back to find emtpy lines
    # 687 was empty, 686 was }
    if lines[aws_start-1].strip() == '':
        lines[aws_start-1] = '  }\n'
    if lines[aws_start-2].strip() == '}':
        lines[aws_start-2] = '    };\n'

# 2. AWS Textract (approx 786)
# Look for private async processWithAzureVision
azure_start = find_line_with_content('private async processWithAzureVision')
if azure_start != -1:
    if lines[azure_start-1].strip() == '':
        lines[azure_start-1] = '  }\n'
    if lines[azure_start-2].strip() == '}':
        lines[azure_start-2] = '    };\n'

# 3. Azure Vision (approx 864)
# Look for private async detectDocumentFormat
fmt_start = find_line_with_content('private async detectDocumentFormat')
if fmt_start != -1:
    if lines[fmt_start-1].strip() == '':
        lines[fmt_start-1] = '  }\n'
    if lines[fmt_start-2].strip() == '}':
        lines[fmt_start-2] = '    };\n'

# 4. detectDocumentFormat end
# Look for csv key in formatMap
csv_idx = find_line_with_content("'.csv': DocumentFormat.CSV")
if csv_idx != -1:
    # Next line }
    if lines[csv_idx+1].strip() == '}':
        lines[csv_idx+1] = '    };\n'
        # Insert return logic if missing
        if 'return formatMap' not in lines[csv_idx+2]:
             lines.insert(csv_idx+2, '    return formatMap[ext] || DocumentFormat.IMAGE_JPEG;\n')
             lines.insert(csv_idx+3, '  }\n')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
