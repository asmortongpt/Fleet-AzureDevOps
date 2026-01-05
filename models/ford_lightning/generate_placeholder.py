import bpy
import bmesh
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create truck body (simplified F-150 Lightning proportions)
def create_truck():
    # Cab
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1.2))
    cab = bpy.context.active_object
    cab.scale = (1.2, 2, 1)  # Width, length, height
    cab.name = "Cab"

    # Bed
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, -3, 1))
    bed = bpy.context.active_object
    bed.scale = (1.2, 1.8, 0.6)
    bed.name = "Bed"

    # Hood
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 2.5, 1))
    hood = bpy.context.active_object
    hood.scale = (1.2, 1, 0.5)
    hood.name = "Hood"

    # Wheels (4)
    wheel_positions = [
        (1, 1.5, 0.4),   # Front right
        (-1, 1.5, 0.4),  # Front left
        (1, -2.5, 0.4),  # Rear right
        (-1, -2.5, 0.4)  # Rear left
    ]

    for i, pos in enumerate(wheel_positions):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.4,
            depth=0.3,
            location=pos,
            rotation=(0, math.pi/2, 0)
        )
        wheel = bpy.context.active_object
        wheel.name = f"Wheel_{i}"

    # Front grille (LED light bar)
    bpy.ops.mesh.primitive_cube_add(size=0.1, location=(0, 3.5, 1.2))
    grille = bpy.context.active_object
    grille.scale = (2, 0.1, 0.3)
    grille.name = "Grille"

    # Select all truck parts
    bpy.ops.object.select_all(action='SELECT')

    # Join into one mesh
    bpy.ops.object.join()
    truck = bpy.context.active_object
    truck.name = "Ford_Lightning_Base"

    # Add smooth shading
    bpy.ops.object.shade_smooth()

    # Create material
    mat = bpy.data.materials.new(name="TruckPaint")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]

    # Default blue color
    bsdf.inputs['Base Color'].default_value = (0.118, 0.227, 0.373, 1.0)  # Antimatter Blue
    bsdf.inputs['Metallic'].default_value = 0.8
    bsdf.inputs['Roughness'].default_value = 0.2

    truck.data.materials.append(mat)

    return truck

# Generate truck
truck = create_truck()

# Export as GLB
output_path = './ford_lightning_base.glb'
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    use_selection=False
)

print(f"✅ Placeholder truck model created: {output_path}")
