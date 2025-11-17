#!/usr/bin/env python3
"""
Convert the transparent DCF Fleet logo to iOS app icons with white background
"""

from PIL import Image
import os

def convert_transparent_to_ios_icon(transparent_image_path, output_dir):
    """Convert transparent logo to iOS app icons with white background"""
    
    # Open the transparent image
    if os.path.exists(transparent_image_path):
        transparent_img = Image.open(transparent_image_path)
    else:
        print(f"Error: Image not found at {transparent_image_path}")
        return
    
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
    
    for size, filename in sizes:
        # Create white background
        icon = Image.new('RGB', (size, size), (255, 255, 255))
        
        # Resize transparent image to fit
        resized = transparent_img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Convert RGBA to RGB with white background
        if resized.mode == 'RGBA':
            # Paste transparent image on white background
            icon.paste(resized, (0, 0), resized)
        else:
            icon = resized.convert('RGB')
        
        # Save the icon
        output_path = os.path.join(output_dir, f"{filename}.png")
        icon.save(output_path, "PNG")
        print(f"Created: {filename}.png ({size}x{size})")

if __name__ == "__main__":
    # Paths
    transparent_logo = "/Users/andrewmorton/Downloads/FDCF_Fleet_Logo_Transparent.png"  # Adjust if needed
    icon_dir = "/Users/andrewmorton/Documents/GitHub/fleet-management/fleet-management-system/ios/App/App/Assets.xcassets/AppIcon.appiconset"
    
    print("Converting transparent DCF Fleet logo to iOS app icons...")
    
    # First check if we have the transparent logo in Downloads
    if not os.path.exists(transparent_logo):
        # Try to find it in other common locations
        possible_paths = [
            "/tmp/dcf_transparent_logo.png",
            "/Users/andrewmorton/Desktop/FDCF_Fleet_Logo.png",
            "/Users/andrewmorton/Documents/FDCF_Fleet_Logo.png"
        ]
        for path in possible_paths:
            if os.path.exists(path):
                transparent_logo = path
                break
    
    if os.path.exists(transparent_logo):
        convert_transparent_to_ios_icon(transparent_logo, icon_dir)
        print("All DCF Fleet app icons created successfully!")
    else:
        print("Error: Could not find the transparent logo image")
        print("Please ensure the DCF Fleet logo is saved as FDCF_Fleet_Logo_Transparent.png")