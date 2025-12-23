lines = open('api/src/routes/mobile-messaging.routes.ts').readlines()

for i in range(len(lines)):
    # lines 38-40: z.array(z.string().email()] -> z.array(z.string().email())]
    if "z.array(z.string().email()]" in lines[i]:
        lines[i] = lines[i].replace("z.array(z.string().email()]", "z.array(z.string().email())]")

    # Line 312: attachments: z.array(z.any().optional(), -> attachments: z.array(z.any().optional()),
    if "attachments: z.array(z.any().optional()," in lines[i]:
         lines[i] = lines[i].replace("attachments: z.array(z.any().optional(),", "attachments: z.array(z.any().optional()),")

    # Replace invalid backticks with single quotes
    # Only if they are inside typical patterns seen
    # `string` -> 'string'
    
    # Specific known bad lines:
    # ` `
    if "` `" in lines[i]:
        lines[i] = lines[i].replace("` `", "' '")

    # `driver`
    if "`driver`" in lines[i]:
        lines[i] = lines[i].replace("`driver`", "'driver'")

    # `manager`
    if "`manager`" in lines[i]:
         lines[i] = lines[i].replace("`manager`", "'manager'")
    
    # `sent`
    if "`sent`" in lines[i]:
        lines[i] = lines[i].replace("`sent`", "'sent'")

    # `Email`
    if "`Email`" in lines[i]:
        lines[i] = lines[i].replace("`Email`", "'Email'")

    # `Outbound`
    if "`Outbound`" in lines[i]:
         lines[i] = lines[i].replace("`Outbound`", "'Outbound'")

    # `SMS`
    if "`SMS`" in lines[i]:
        lines[i] = lines[i].replace("`SMS`", "'SMS'")
        
    # `Related`
    if "`Related`" in lines[i]:
        lines[i] = lines[i].replace("`Related`", "'Related'")


with open('api/src/routes/mobile-messaging.routes.ts', 'w') as f:
    f.writelines(lines)
