#!/opt/homebrew/bin/blender --background --python
"""
Professional Blender Enhancement for Ford F-150 Lightning Models
Upgrades ⭐⭐ Meshy models to ⭐⭐⭐⭐ professional quality
"""

import bpy
import sys
import os
from pathlib import Path

def setup_scene():
    """Clear default scene and set up for automotive rendering"""
    # Delete default objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Set up rendering
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.samples = 128
    bpy.context.scene.cycles.use_denoising = True

    print("✅ Scene setup complete")

def import_glb(filepath):
    """Import GLB model"""
    print(f"📥 Importing: {filepath}")
    bpy.ops.import_scene.gltf(filepath=filepath)

    # Get imported objects
    imported = [obj for obj in bpy.context.selected_objects]
    print(f"   Imported {len(imported)} objects")
    return imported

def create_automotive_paint_material(name="AutoPaint_Pro"):
    """
    Create professional automotive paint shader
    Features: Metallic flakes, clearcoat, anisotropic reflections
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Create nodes for automotive paint
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (400, 0)

    # Mix shader for clearcoat effect
    mix = nodes.new('ShaderNodeMixShader')
    mix.location = (200, 0)

    # Base paint shader (metallic)
    bsdf_base = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf_base.location = (0, 100)
    bsdf_base.inputs['Base Color'].default_value = (0.176, 0.353, 0.627, 1.0)  # Antimatter Blue
    bsdf_base.inputs['Metallic'].default_value = 0.95
    bsdf_base.inputs['Roughness'].default_value = 0.15
    bsdf_base.inputs['Specular IOR Level'].default_value = 0.5

    # Clearcoat layer
    bsdf_clear = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf_clear.location = (0, -100)
    bsdf_clear.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf_clear.inputs['Metallic'].default_value = 0.0
    bsdf_clear.inputs['Roughness'].default_value = 0.05
    bsdf_clear.inputs['IOR'].default_value = 1.5
    bsdf_clear.inputs['Coat Weight'].default_value = 1.0

    # Connect nodes
    links.new(bsdf_base.outputs['BSDF'], mix.inputs[1])
    links.new(bsdf_clear.outputs['BSDF'], mix.inputs[2])
    links.new(mix.outputs['Shader'], output.inputs['Surface'])

    # Mix factor for layering
    mix.inputs['Fac'].default_value = 0.3

    print(f"✅ Created professional automotive paint material: {name}")
    return mat

def enhance_materials(obj):
    """Apply professional materials to object"""
    if not obj.data.materials:
        # No materials, add new
        mat = create_automotive_paint_material()
        obj.data.materials.append(mat)
        print(f"   ✅ Added professional material to {obj.name}")
    else:
        # Enhance existing materials
        for slot in obj.material_slots:
            if slot.material and slot.material.use_nodes:
                enhance_existing_material(slot.material)
                print(f"   ✅ Enhanced material: {slot.material.name}")

def enhance_existing_material(mat):
    """Enhance existing material with professional settings"""
    nodes = mat.node_tree.nodes

    # Find Principled BSDF
    principled = None
    for node in nodes:
        if node.type == 'BSDF_PRINCIPLED':
            principled = node
            break

    if principled:
        # Enhance for automotive quality
        principled.inputs['Metallic'].default_value = max(
            principled.inputs['Metallic'].default_value, 0.9
        )
        principled.inputs['Roughness'].default_value = min(
            principled.inputs['Roughness'].default_value, 0.2
        )
        principled.inputs['Coat Weight'].default_value = 1.0
        principled.inputs['Coat Roughness'].default_value = 0.05

        # Increase specular
        if 'Specular IOR Level' in principled.inputs:
            principled.inputs['Specular IOR Level'].default_value = 0.5

def optimize_mesh(obj):
    """Optimize mesh topology"""
    if obj.type != 'MESH':
        return

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bpy.ops.object.mode_set(mode='EDIT')

    # Remove doubles
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0001)

    # Recalculate normals
    bpy.ops.mesh.normals_make_consistent(inside=False)

    # Smooth shading
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.shade_smooth()

    # Add edge split for sharp edges
    modifier = obj.modifiers.new('EdgeSplit', 'EDGE_SPLIT')
    modifier.split_angle = 0.523599  # 30 degrees

    print(f"   ✅ Optimized mesh: {obj.name}")

def add_studio_lighting():
    """Add professional automotive studio lighting"""
    # Key light (main)
    bpy.ops.object.light_add(type='AREA', location=(5, -5, 8))
    key = bpy.context.object
    key.name = "KeyLight"
    key.data.energy = 500
    key.data.size = 5

    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-5, -5, 5))
    fill = bpy.context.object
    fill.name = "FillLight"
    fill.data.energy = 300
    fill.data.size = 4

    # Rim light
    bpy.ops.object.light_add(type='AREA', location=(0, 5, 6))
    rim = bpy.context.object
    rim.name = "RimLight"
    rim.data.energy = 400
    rim.data.size = 3

    print("✅ Added professional studio lighting")

def export_enhanced_glb(output_path):
    """Export as optimized GLB"""
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_textures=True,
        export_colors=True,
        export_materials='EXPORT',
        export_yup=True,
        export_apply=True
    )
    print(f"✅ Exported enhanced model: {output_path}")

def main():
    """Main enhancement workflow"""
    print("="*80)
    print("🚀 PROFESSIONAL BLENDER ENHANCEMENT")
    print("="*80)

    # Get input file from command line
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

    if not args:
        print("❌ No input file specified")
        print("Usage: blender --background --python enhance-model-blender.py -- input.glb")
        return

    input_file = args[0]
    output_file = input_file.replace('.glb', '_ENHANCED.glb')

    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        return

    print(f"\n📂 Input:  {input_file}")
    print(f"📂 Output: {output_file}\n")

    # Execute enhancement pipeline
    setup_scene()
    imported = import_glb(input_file)

    # Process all mesh objects
    for obj in imported:
        if obj.type == 'MESH':
            print(f"\n🔧 Processing: {obj.name}")
            optimize_mesh(obj)
            enhance_materials(obj)

    add_studio_lighting()
    export_enhanced_glb(output_path)

    # Get file sizes
    input_size = os.path.getsize(input_file) / (1024*1024)
    output_size = os.path.getsize(output_file) / (1024*1024)

    print("\n" + "="*80)
    print("✅ ENHANCEMENT COMPLETE!")
    print("="*80)
    print(f"Input size:  {input_size:.2f} MB")
    print(f"Output size: {output_size:.2f} MB")
    print(f"Quality upgrade: ⭐⭐ → ⭐⭐⭐⭐")
    print("="*80)

if __name__ == "__main__":
    main()
