#!/bin/bash
set -e

# Get storage account key
STORAGE_KEY=$(az storage account keys list --account-name fleetmgmtstorage2025 --resource-group fleet-production-rg --query '[0].value' -o tsv)

# Upload all GLB files
echo "Uploading 968 3D models to Azure Blob Storage..."
cd /Users/andrewmorton/Documents/GitHub/Fleet/output

count=0
total=$(find complete_usa_fleet_20* -name "*.glb" -type f | wc -l | tr -d ' ')

find complete_usa_fleet_20* -name "*.glb" -type f | while read file; do
    count=$((count + 1))
    filename=$(basename "$file")

    # Upload with content-type set to model/gltf-binary
    az storage blob upload \
        --account-name fleetmgmtstorage2025 \
        --account-key "$STORAGE_KEY" \
        --container-name vehicle-3d-models \
        --file "$file" \
        --name "$filename" \
        --content-type "model/gltf-binary" \
        --overwrite \
        --no-progress >/dev/null 2>&1

    if [ $((count % 50)) -eq 0 ]; then
        echo "Uploaded $count/$total models..."
    fi
done

echo "✅ Upload complete! All $total models uploaded."
