#!/usr/bin/env python3
"""
Create the OFFICIAL DCF Fleet logo as shown in the provided image
"""

from PIL import Image, ImageDraw, ImageFont
import math

def create_official_dcf_fleet_logo(size=1024):
    """Create the official DCF Fleet logo"""
    
    # Create image with WHITE background (no transparency for iOS app icons)
    img = Image.new('RGB', (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Colors from the official logo
    dcf_blue = (0, 102, 204)  # Bright blue for outer ring
    dcf_yellow = (255, 193, 7)  # Yellow/orange for FLEET text and sun
    dcf_green = (76, 175, 80)  # Green for child figure
    gray_border = (200, 200, 200)  # Light gray outer border
    
    # Calculate dimensions
    center = size // 2
    outer_radius = int(size * 0.48)
    inner_radius = int(size * 0.35)
    
    # Draw gray outer border
    draw.ellipse([
        center - outer_radius - 3,
        center - outer_radius - 3,
        center + outer_radius + 3,
        center + outer_radius + 3
    ], outline=gray_border, width=6)
    
    # Draw blue outer ring
    draw.ellipse([
        center - outer_radius,
        center - outer_radius,
        center + outer_radius,
        center + outer_radius
    ], fill=dcf_blue)
    
    # Draw white inner circle
    draw.ellipse([
        center - inner_radius,
        center - inner_radius,
        center + inner_radius,
        center + inner_radius
    ], fill='white')
    
    # Draw curved text at top: "FLORIDA DEPARTMENT OF"
    try:
        font_size = int(size * 0.055)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = None
    
    top_text = "FLORIDA DEPARTMENT OF"
    if font:
        # Simple centered text at top of blue ring
        bbox = draw.textbbox((0, 0), top_text, font=font)
        text_width = bbox[2] - bbox[0]
        draw.text((center - text_width // 2, center - outer_radius + 15), 
                  top_text, fill='white', font=font)
    
    # Draw curved text at bottom: "CHILDREN & FAMILIES"
    bottom_text = "CHILDREN & FAMILIES"
    if font:
        bbox = draw.textbbox((0, 0), bottom_text, font=font)
        text_width = bbox[2] - bbox[0]
        draw.text((center - text_width // 2, center + outer_radius - 55), 
                  bottom_text, fill='white', font=font)
    
    # Draw "FLEET" text in yellow
    fleet_text = "FLEET"
    try:
        fleet_font_size = int(size * 0.12)
        fleet_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", fleet_font_size)
    except:
        fleet_font = font
    
    if fleet_font:
        bbox = draw.textbbox((0, 0), fleet_text, font=fleet_font)
        text_width = bbox[2] - bbox[0]
        draw.text((center - text_width // 2, center - inner_radius + 20), 
                  fleet_text, fill=dcf_yellow, font=fleet_font)
    
    # Draw yellow sun circle
    sun_radius = int(size * 0.08)
    sun_center_y = center - int(size * 0.05)
    draw.ellipse([
        center - sun_radius,
        sun_center_y - sun_radius,
        center + sun_radius,
        sun_center_y + sun_radius
    ], fill=dcf_yellow)
    
    # Draw family figures (simplified stick figures)
    # Adult 1 (blue)
    adult1_x = center - int(size * 0.06)
    adult_y = center - int(size * 0.08)
    # Head
    draw.ellipse([adult1_x - 8, adult_y - 8, adult1_x + 8, adult_y + 8], fill=dcf_blue)
    # Body
    draw.rectangle([adult1_x - 6, adult_y + 8, adult1_x + 6, adult_y + 30], fill=dcf_blue)
    
    # Adult 2 (blue)
    adult2_x = center + int(size * 0.06)
    # Head
    draw.ellipse([adult2_x - 8, adult_y - 8, adult2_x + 8, adult_y + 8], fill=dcf_blue)
    # Body
    draw.rectangle([adult2_x - 6, adult_y + 8, adult2_x + 6, adult_y + 30], fill=dcf_blue)
    
    # Child (green)
    child_x = center
    child_y = center - int(size * 0.05)
    # Head
    draw.ellipse([child_x - 6, child_y - 6, child_x + 6, child_y + 6], fill=dcf_green)
    # Body
    draw.rectangle([child_x - 4, child_y + 6, child_x + 4, child_y + 20], fill=dcf_green)
    
    # Draw car (simplified)
    car_y = center + int(size * 0.08)
    car_width = int(size * 0.12)
    car_height = int(size * 0.06)
    draw.rectangle([
        center - car_width // 2,
        car_y,
        center + car_width // 2,
        car_y + car_height
    ], fill=dcf_blue)
    
    # Draw curved road
    road_y = center + int(size * 0.15)
    # Simple curved line to represent road
    points = []
    for i in range(20):
        x = center - int(size * 0.15) + i * int(size * 0.015)
        y = road_y + int(10 * math.sin(i * 0.3))
        points.append((x, y))
    
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=dcf_blue, width=8)
    
    # Draw star on right side
    star_x = center + int(size * 0.32)
    star_y = center - int(size * 0.25)
    star_size = int(size * 0.03)
    # Simple star shape
    draw.polygon([
        (star_x, star_y - star_size),
        (star_x + star_size // 3, star_y - star_size // 3),
        (star_x + star_size, star_y),
        (star_x + star_size // 3, star_y + star_size // 3),
        (star_x, star_y + star_size),
        (star_x - star_size // 3, star_y + star_size // 3),
        (star_x - star_size, star_y),
        (star_x - star_size // 3, star_y - star_size // 3)
    ], fill='white')
    
    return img

def generate_all_icon_sizes():
    """Generate all iOS app icon sizes"""
    
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
    base_icon = create_official_dcf_fleet_logo(1024)
    
    # Save icons
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
    print("Creating OFFICIAL DCF Fleet app icons...")
    generate_all_icon_sizes()
    print("Official DCF Fleet app icons created successfully!")