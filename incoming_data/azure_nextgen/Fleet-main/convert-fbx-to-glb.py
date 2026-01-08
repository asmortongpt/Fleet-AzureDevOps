#!/usr/bin/env python3
"""
FBX to GLB Converter for TurboSquid Models
Converts downloaded FBX models to optimized GLB format for web viewing
"""

import subprocess
import sys
import os
from pathlib import Path

def check_blender_installed():
    """Check if Blender is installed and available"""
    try:
        result = subprocess.run(['blender', '--version'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Blender found: {result.stdout.split()[1]}")
            return True
    except FileNotFoundError:
        pass

    print("❌ Blender not found. Installing via Homebrew...")
    return False

def install_blender():
    """Install Blender using Homebrew"""
    print("📦 Installing Blender (this may take a few minutes)...")
    try:
        subprocess.run(['brew', 'install', '--cask', 'blender'], check=True)
        print("✅ Blender installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install Blender")
        print("Please install manually from: https://www.blender.org/download/")
        return False

def convert_fbx_to_glb(fbx_path, output_path=None):
    """
    Convert FBX file to GLB using Blender

    Args:
        fbx_path: Path to input FBX file
        output_path: Optional custom output path (defaults to same name .glb)
    """
    fbx_path = Path(fbx_path)

    if not fbx_path.exists():
        print(f"❌ File not found: {fbx_path}")
        return False

    if output_path is None:
        output_path = fbx_path.parent / f"{fbx_path.stem}_Professional.glb"
    else:
        output_path = Path(output_path)

    print(f"🔄 Converting: {fbx_path.name}")
    print(f"📥 Input:  {fbx_path}")
    print(f"📤 Output: {output_path}")

    # Blender Python script for conversion
    blender_script = f"""
import bpy
import sys

# Clear default scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import FBX
print("Importing FBX...")
bpy.ops.import_scene.fbx(filepath=r"{fbx_path}")

# Export as GLB with optimizations
print("Exporting as GLB...")
bpy.ops.export_scene.gltf(
    filepath=r"{output_path}",
    export_format='GLB',
    export_textures=True,
    export_colors=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_texture_dir='',
    export_yup=True,
    export_apply=True,
    export_lights=False,
    export_cameras=False
)

print("✅ Conversion complete!")
sys.exit(0)
"""

    # Write temporary Blender script
    script_path = fbx_path.parent / "_convert_temp.py"
    with open(script_path, 'w') as f:
        f.write(blender_script)

    try:
        # Run Blender in background mode
        result = subprocess.run([
            'blender',
            '--background',
            '--python', str(script_path)
        ], capture_output=True, text=True, timeout=300)

        # Clean up temp script
        script_path.unlink()

        if output_path.exists():
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"✅ Conversion successful!")
            print(f"📊 Output file size: {size_mb:.2f} MB")
            print(f"📁 Saved to: {output_path}")
            return True
        else:
            print("❌ Conversion failed - output file not created")
            print(result.stderr)
            return False

    except subprocess.TimeoutExpired:
        print("❌ Conversion timeout (5 minutes exceeded)")
        script_path.unlink(missing_ok=True)
        return False
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        script_path.unlink(missing_ok=True)
        return False

def find_fbx_files(directory):
    """Find all FBX files in directory"""
    directory = Path(directory)
    fbx_files = list(directory.glob("*.fbx")) + list(directory.glob("*.FBX"))
    return fbx_files

def main():
    """Main conversion workflow"""
    print("="*80)
    print("FBX to GLB Converter - TurboSquid Professional Models")
    print("="*80)

    # Check for Blender
    if not check_blender_installed():
        if not install_blender():
            sys.exit(1)

    # Look for FBX files in downloads folder
    downloads_dir = Path(__file__).parent / "downloads"

    if not downloads_dir.exists():
        print(f"❌ Downloads folder not found: {downloads_dir}")
        print("Please download your TurboSquid FBX model to:")
        print(f"   {downloads_dir}")
        sys.exit(1)

    fbx_files = find_fbx_files(downloads_dir)

    if not fbx_files:
        print(f"❌ No FBX files found in: {downloads_dir}")
        print("\nPlease:")
        print("1. Login to TurboSquid (asmorton@gmail.com)")
        print("2. Purchase Ford F-150 Lightning model")
        print("3. Download in FBX format")
        print(f"4. Save to: {downloads_dir}")
        sys.exit(1)

    print(f"\n📁 Found {len(fbx_files)} FBX file(s):\n")
    for i, fbx in enumerate(fbx_files, 1):
        size_mb = fbx.stat().st_size / (1024 * 1024)
        print(f"   {i}. {fbx.name} ({size_mb:.2f} MB)")

    # Convert all FBX files
    print("\n🔄 Starting conversions...\n")
    success_count = 0

    for fbx in fbx_files:
        if convert_fbx_to_glb(fbx):
            success_count += 1
        print()

    print("="*80)
    print(f"✅ Converted {success_count}/{len(fbx_files)} files successfully")
    print("="*80)

    # Move converted files to output folder
    output_dir = Path(__file__).parent / "output"
    glb_files = list(downloads_dir.glob("*_Professional.glb"))

    if glb_files:
        print(f"\n📦 Moving GLB files to output folder...")
        for glb in glb_files:
            dest = output_dir / glb.name
            glb.rename(dest)
            print(f"   ✅ {dest.name}")

        print(f"\n🎨 Ready to create viewer! GLB files are in:")
        print(f"   {output_dir}")

if __name__ == "__main__":
    main()
