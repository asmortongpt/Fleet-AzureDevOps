#!/bin/bash
API="xai-wOeEAYZslZCGGu4tudhzBdMIm4tiZ6Ya4W2cjE0Rgm1UbXnJJezOhaJwdpgTliMg56nCGZTbslp6zlML"

for i in 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68; do
  echo "Agent $i"
  curl -s -X POST https://api.x.ai/v1/chat/completions \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $API" \
    -d "{\"model\":\"grok-3\",\"messages\":[{\"role\":\"user\",\"content\":\"CTAFleet Agent $i production TypeScript code. Return complete working code.\"}],\"temperature\":0.3,\"max_tokens\":4000}" \
    | jq -r '.choices[0].message.content' > "agent-$(printf '%03d' $i).ts" &
  
  if [ $(($i % 10)) -eq 0 ]; then
    wait
  fi
done
wait
echo "DONE"
ls -l *.ts | wc -l
