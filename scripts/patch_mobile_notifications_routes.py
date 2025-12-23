lines = open('api/src/routes/mobile-notifications.routes.ts').readlines()

for i in range(len(lines)):
    # Line 606: }); -> })); since it is closing asyncHandler wrapped function inside router.post
    # Only if line 597 uses asyncHandler
    if lines[i].strip() == "});" and i > 600:
         # Double check context
         # Line 597: router.post('/webhooks/twilio', ... asyncHandler(async (req, res) => {
         # So we need to close function }, close asyncHandler ), close router.post )
         # So }));
         pass # Actually let's just make sure we are targeting the right block.
    
    if i == 605: # 0-indexed, so line 606 is index 605
        # Previous line is 604: res.status(500).send('Error');
        # Line 606 (index 605) is });
        if lines[i].strip() == "});":
            lines[i] = lines[i].replace("});", "}));")

    # Line 12: ; -> empty
    if i == 11 and lines[i].strip() == ";":
        lines[i] = ""

with open('api/src/routes/mobile-notifications.routes.ts', 'w') as f:
    f.writelines(lines)
