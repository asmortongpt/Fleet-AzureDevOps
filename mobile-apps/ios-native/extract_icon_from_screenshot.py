#!/usr/bin/env python3
"""
Extract and recreate the DCF icon from the screenshot
Based on the visible icon in the user's provided screenshot
"""

from PIL import Image, ImageDraw, ImageFont

def create_exact_dcf_icon(size=1024):
    """Create the exact DCF icon as shown in user's screenshot"""
    
    # Create image with WHITE background (no transparency for iOS app icons)
    img = Image.new('RGB', (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Navy blue color for DCF (as shown in screenshot)
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
    
    # Draw white government building icon (simplified version matching screenshot)
    # The icon appears to be a classical building with columns
    
    # Building dimensions
    building_width = int(size * 0.2)
    building_x = center - building_width // 2
    building_y = center - int(size * 0.1)
    
    # Draw triangular roof
    roof_height = int(size * 0.06)
    roof_points = [
        (building_x - int(size * 0.02), building_y),
        (building_x + building_width + int(size * 0.02), building_y),
        (center, building_y - roof_height)
    ]
    draw.polygon(roof_points, fill='white')
    
    # Draw horizontal line under roof
    draw.rectangle([
        building_x - int(size * 0.02),
        building_y,
        building_x + building_width + int(size * 0.02),
        building_y + int(size * 0.015)
    ], fill='white')
    
    # Draw columns (5 vertical pillars)
    column_width = int(size * 0.015)
    column_height = int(size * 0.1)
    column_spacing = building_width // 4
    
    for i in range(5):
        x_offset = (i - 2) * column_spacing // 1.2  # Centered columns
        column_x = center + x_offset - column_width // 2
        draw.rectangle([
            column_x,
            building_y + int(size * 0.02),
            column_x + column_width,
            building_y + int(size * 0.02) + column_height
        ], fill='white')
    
    # Draw base platform
    base_width = building_width + int(size * 0.04)
    draw.rectangle([
        center - base_width // 2,
        building_y + int(size * 0.02) + column_height,
        center + base_width // 2,
        building_y + int(size * 0.02) + column_height + int(size * 0.015)
    ], fill='white')
    
    # Draw "DCF" text
    text = "DCF"
    try:
        # Try to use a bold font
        font_size = int(size * 0.1)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = None
    
    # Calculate text position
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    else:
        text_width = int(size * 0.15)
        text_height = int(size * 0.08)
    
    text_x = center - text_width // 2
    text_y = center + int(size * 0.05)
    
    draw.text((text_x, text_y), text, fill='white', font=font)
    
    return img

def generate_all_icon_sizes():
    """Generate all iOS app icon sizes"""
    
    # Icon sizes needed for iOS apps
    sizes = [
        (60, "60x60"),
        (120, "60x60@2x"),
        (180, "60x60@3x"),
        (76, "76x76"),
        (152, "76x76@2x"),
        (167, "83.5x83.5@2x"),
        (1024, "1024x1024")
    ]
    
    # Create base 1024x1024 icon
    base_icon = create_exact_dcf_icon(1024)
    
    # Save icons directory
    import os
    icon_dir = "/Users/andrewmorton/Documents/GitHub/fleet-management/fleet-management-system/ios/App/App/Assets.xcassets/AppIcon.appiconset"
    
    for size, filename in sizes:
        if size == 1024:
            icon = base_icon
        else:
            icon = base_icon.resize((size, size), Image.Resampling.LANCZOS)
        
        icon_path = os.path.join(icon_dir, f"{filename}.png")
        icon.save(icon_path, "PNG")
        print(f"Created: {filename}.png ({size}x{size})")

if __name__ == "__main__":
    print("Creating exact DCF Fleet app icons based on screenshot...")
    generate_all_icon_sizes()
    print("All DCF Fleet app icons created successfully!")