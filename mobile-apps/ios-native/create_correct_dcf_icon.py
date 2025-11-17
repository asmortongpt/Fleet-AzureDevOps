#!/usr/bin/env python3
"""
Create the correct DCF app icon based on the user's provided design.
Simple navy blue circle with white government building icon and "DCF" text.
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_correct_dcf_icon(size=1024):
    """Create the correct DCF icon matching user's design"""
    
    # Create image with WHITE background (no transparency for iOS app icons)
    img = Image.new('RGB', (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Navy blue color for DCF
    navy_blue = (0, 51, 102)  # #003366
    
    # Calculate dimensions
    center = size // 2
    circle_radius = int(size * 0.45)  # 45% of size
    
    # Draw navy blue circle background
    circle_bbox = [
        center - circle_radius,
        center - circle_radius,
        center + circle_radius,
        center + circle_radius
    ]
    draw.ellipse(circle_bbox, fill=navy_blue)
    
    # Draw white government building icon (simple columns)
    building_width = int(size * 0.25)
    building_height = int(size * 0.15)
    building_x = center - building_width // 2
    building_y = center - int(size * 0.08)
    
    # Building top (triangle roof)
    roof_points = [
        (building_x, building_y),
        (building_x + building_width, building_y),
        (building_x + building_width // 2, building_y - int(size * 0.04))
    ]
    draw.polygon(roof_points, fill=(255, 255, 255))
    
    # Building columns (5 columns)
    column_width = building_width // 6
    column_height = building_height
    column_spacing = building_width // 5
    
    for i in range(5):
        column_x = building_x + (i * column_spacing)
        column_rect = [
            column_x,
            building_y,
            column_x + column_width,
            building_y + column_height
        ]
        draw.rectangle(column_rect, fill=(255, 255, 255))
    
    # Building base
    base_rect = [
        building_x - int(size * 0.01),
        building_y + column_height,
        building_x + building_width + int(size * 0.01),
        building_y + column_height + int(size * 0.02)
    ]
    draw.rectangle(base_rect, fill=(255, 255, 255))
    
    # Try to load a font, fall back to default if not available
    try:
        font_size = int(size * 0.08)  # 8% of total size
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.load_default()
        except:
            font = None
    
    # Draw "DCF" text
    text = "DCF"
    if font:
        # Get text dimensions for centering
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
    else:
        # Estimate dimensions if no font available
        text_width = int(size * 0.15)
        text_height = int(size * 0.05)
    
    text_x = center - text_width // 2
    text_y = center + int(size * 0.12)  # Below the building
    
    draw.text((text_x, text_y), text, fill=(255, 255, 255), font=font)
    
    return img

def generate_all_icon_sizes():
    """Generate all iOS app icon sizes"""
    
    # Icon sizes needed for iOS apps
    sizes = [
        (60, 60, "60x60"),      # iPhone app icon @1x
        (120, 120, "60x60@2x"), # iPhone app icon @2x  
        (180, 180, "60x60@3x"), # iPhone app icon @3x
        (76, 76, "76x76"),      # iPad app icon @1x
        (152, 152, "76x76@2x"), # iPad app icon @2x
        (167, 167, "83.5x83.5@2x"), # iPad Pro app icon @2x
        (1024, 1024, "1024x1024") # App Store icon
    ]
    
    # Create base 1024x1024 icon
    base_icon = create_correct_dcf_icon(1024)
    
    # Save icons directory
    icon_dir = "/Users/andrewmorton/Documents/GitHub/fleet-management/fleet-management-system/ios/App/App/Assets.xcassets/AppIcon.appiconset"
    
    for width, height, filename in sizes:
        if width == 1024:
            icon = base_icon
        else:
            icon = base_icon.resize((width, height), Image.Resampling.LANCZOS)
        
        icon_path = os.path.join(icon_dir, f"{filename}.png")
        icon.save(icon_path, "PNG")
        print(f"Created: {filename}.png ({width}x{height})")

if __name__ == "__main__":
    print("Creating correct DCF Fleet app icons...")
    generate_all_icon_sizes()
    print("All DCF Fleet app icons created successfully!")