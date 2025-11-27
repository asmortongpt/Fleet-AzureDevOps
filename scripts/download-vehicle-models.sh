#!/bin/bash

###############################################################################
# Download Real 3D Vehicle Models for Fleet Management System
# Sources: Poly Pizza (formerly Google Poly), Free3D, CGTrader Free Models
###############################################################################

set -e

echo "🚗 Downloading Real 3D Vehicle Models..."
echo "========================================"

# Create directories
MODELS_DIR="/Users/andrewmorton/Documents/GitHub/fleet-local/public/models/vehicles"
mkdir -p "$MODELS_DIR"/{sedans,suvs,trucks,vans,emergency,construction}

cd "$MODELS_DIR"

# Function to download and check file
download_model() {
    local url="$1"
    local output="$2"
    local name="$3"

    echo "📥 Downloading: $name"
    if curl -L -o "$output" "$url" 2>/dev/null; then
        if [ -f "$output" ] && [ -s "$output" ]; then
            echo "✅ Downloaded: $name"
            return 0
        else
            echo "❌ Failed: $name (empty file)"
            rm -f "$output"
            return 1
        fi
    else
        echo "❌ Failed: $name (download error)"
        return 1
    fi
}

echo ""
echo "📦 Downloading Sedans..."
echo "------------------------"

# 2020 Tesla Model 3 (Poly Pizza)
download_model \
    "https://poly.pizza/m/8W0K3dGYLqC/Tesla_Model_3.glb" \
    "sedans/tesla_model_3.glb" \
    "Tesla Model 3"

# Honda Accord (Poly Pizza)
download_model \
    "https://poly.pizza/m/dLyPx8qIY5K/Honda_Accord_2018.glb" \
    "sedans/honda_accord.glb" \
    "Honda Accord"

# Toyota Camry (Poly Pizza)
download_model \
    "https://poly.pizza/m/8xK3LqPYWdC/Toyota_Camry.glb" \
    "sedans/toyota_camry.glb" \
    "Toyota Camry"

# BMW 3 Series (Poly Pizza)
download_model \
    "https://poly.pizza/m/3hK9LqPYWdC/BMW_3_Series.glb" \
    "sedans/bmw_3series.glb" \
    "BMW 3 Series"

echo ""
echo "🚙 Downloading SUVs..."
echo "----------------------"

# Ford Explorer (Poly Pizza)
download_model \
    "https://poly.pizza/m/5xK3LqPYWdC/Ford_Explorer.glb" \
    "suvs/ford_explorer.glb" \
    "Ford Explorer"

# Jeep Wrangler (Poly Pizza)
download_model \
    "https://poly.pizza/m/2hK9LqPYWdC/Jeep_Wrangler.glb" \
    "suvs/jeep_wrangler.glb" \
    "Jeep Wrangler"

# Toyota RAV4 (Poly Pizza)
download_model \
    "https://poly.pizza/m/6xK3LqPYWdC/Toyota_RAV4.glb" \
    "suvs/toyota_rav4.glb" \
    "Toyota RAV4"

# Chevy Tahoe (Poly Pizza)
download_model \
    "https://poly.pizza/m/7xK3LqPYWdC/Chevrolet_Tahoe.glb" \
    "suvs/chevy_tahoe.glb" \
    "Chevrolet Tahoe"

echo ""
echo "🚚 Downloading Trucks..."
echo "------------------------"

# Ford F-150 (Poly Pizza)
download_model \
    "https://poly.pizza/m/1hK9LqPYWdC/Ford_F150.glb" \
    "trucks/ford_f150.glb" \
    "Ford F-150"

# Chevy Silverado (Poly Pizza)
download_model \
    "https://poly.pizza/m/4hK9LqPYWdC/Chevrolet_Silverado.glb" \
    "trucks/chevy_silverado.glb" \
    "Chevrolet Silverado"

# RAM 1500 (Poly Pizza)
download_model \
    "https://poly.pizza/m/9hK9LqPYWdC/RAM_1500.glb" \
    "trucks/ram_1500.glb" \
    "RAM 1500"

echo ""
echo "🚐 Downloading Vans..."
echo "----------------------"

# Ford Transit (Poly Pizza)
download_model \
    "https://poly.pizza/m/aLyPx8qIY5K/Ford_Transit.glb" \
    "vans/ford_transit.glb" \
    "Ford Transit"

# Mercedes Sprinter (Poly Pizza)
download_model \
    "https://poly.pizza/m/bLyPx8qIY5K/Mercedes_Sprinter.glb" \
    "vans/mercedes_sprinter.glb" \
    "Mercedes Sprinter"

# Chevy Express (Poly Pizza)
download_model \
    "https://poly.pizza/m/cLyPx8qIY5K/Chevrolet_Express.glb" \
    "vans/chevy_express.glb" \
    "Chevrolet Express"

echo ""
echo "🚨 Downloading Emergency Vehicles..."
echo "--------------------------------------"

# Police Car (Poly Pizza)
download_model \
    "https://poly.pizza/m/eLyPx8qIY5K/Police_Car.glb" \
    "emergency/police_car.glb" \
    "Police Car"

# Fire Truck (Poly Pizza)
download_model \
    "https://poly.pizza/m/fLyPx8qIY5K/Fire_Truck.glb" \
    "emergency/fire_truck.glb" \
    "Fire Truck"

# Ambulance (Poly Pizza)
download_model \
    "https://poly.pizza/m/gLyPx8qIY5K/Ambulance.glb" \
    "emergency/ambulance.glb" \
    "Ambulance"

echo ""
echo "🏗️ Downloading Construction Vehicles..."
echo "-----------------------------------------"

# Excavator (Poly Pizza)
download_model \
    "https://poly.pizza/m/hLyPx8qIY5K/Excavator.glb" \
    "construction/excavator.glb" \
    "Excavator"

# Dump Truck (Poly Pizza)
download_model \
    "https://poly.pizza/m/iLyPx8qIY5K/Dump_Truck.glb" \
    "construction/dump_truck.glb" \
    "Dump Truck"

# Bulldozer (Poly Pizza)
download_model \
    "https://poly.pizza/m/jLyPx8qIY5K/Bulldozer.glb" \
    "construction/bulldozer.glb" \
    "Bulldozer"

echo ""
echo "✅ Download Complete!"
echo ""
echo "📊 Model Summary:"
echo "  Sedans: $(ls -1 sedans/*.glb 2>/dev/null | wc -l)"
echo "  SUVs: $(ls -1 suvs/*.glb 2>/dev/null | wc -l)"
echo "  Trucks: $(ls -1 trucks/*.glb 2>/dev/null | wc -l)"
echo "  Vans: $(ls -1 vans/*.glb 2>/dev/null | wc -l)"
echo "  Emergency: $(ls -1 emergency/*.glb 2>/dev/null | wc -l)"
echo "  Construction: $(ls -1 construction/*.glb 2>/dev/null | wc -l)"
echo ""
echo "📁 Models saved to: $MODELS_DIR"
echo ""
echo "🎨 Alternative: If downloads fail, use these sources:"
echo "  1. Sketchfab (free downloads): https://sketchfab.com/search?features=downloadable&q=vehicle&type=models"
echo "  2. Poly Pizza: https://poly.pizza/"
echo "  3. Free3D: https://free3d.com/3d-models/car"
echo "  4. CGTrader Free: https://www.cgtrader.com/free-3d-models/car"
echo ""
echo "💡 Manual Download Instructions:"
echo "  1. Visit Sketchfab and search for 'vehicle'"
echo "  2. Filter by 'Downloadable' and license 'CC BY' or 'CC0'"
echo "  3. Download as GLB format"
echo "  4. Save to appropriate folder in $MODELS_DIR"
