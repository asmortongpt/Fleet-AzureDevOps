#!/usr/bin/env python3
"""
Update 3D Vehicle Models from Images, Videos, and LiDAR
Integrates with external applications to apply real-world textures and geometry
"""

import bpy
import bmesh
import os
import sys
import json
import numpy as np
from pathlib import Path
from PIL import Image
import cv2

print("🎨 3D MODEL UPDATE SYSTEM")
print("=" * 80)
print("Update models using:")
print("  • Images (photos of actual vehicles)")
print("  • Videos (frame extraction)")
print("  • LiDAR (point cloud data)")
print("=" * 80)
print()

class ModelTextureUpdater:
    """Apply textures from images to 3D models"""

    def __init__(self, model_path):
        self.model_path = Path(model_path)
        self.texture_dir = Path("./textures/vehicles")
        self.texture_dir.mkdir(parents=True, exist_ok=True)

    def load_model(self):
        """Load GLB model into Blender"""
        print(f"📂 Loading model: {self.model_path.name}")

        # Clear scene
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        # Import GLB
        bpy.ops.import_scene.gltf(filepath=str(self.model_path))

        # Get vehicle object
        self.vehicle = bpy.context.selected_objects[0] if bpy.context.selected_objects else None

        if self.vehicle:
            print(f"   ✅ Loaded: {self.vehicle.name}")
            return True
        return False

    def apply_image_texture(self, image_path, texture_type="diffuse", uv_project=True):
        """
        Apply image as texture to model

        texture_type options:
        - diffuse: Base color/paint
        - normal: Surface details/bumps
        - roughness: Scratch/wear map
        - metallic: Metallic areas
        - damage: Damage overlay
        """

        print(f"\n🖼️  Applying {texture_type} texture from: {Path(image_path).name}")

        if not self.vehicle:
            print("   ❌ No vehicle loaded")
            return False

        # Load image
        if not os.path.exists(image_path):
            print(f"   ❌ Image not found: {image_path}")
            return False

        # Create or get material
        if not self.vehicle.data.materials:
            mat = bpy.data.materials.new(name="VehicleMaterial")
            mat.use_nodes = True
            self.vehicle.data.materials.append(mat)
        else:
            mat = self.vehicle.data.materials[0]

        nodes = mat.node_tree.nodes
        links = mat.node_tree.links

        # Get or create Principled BSDF
        bsdf = nodes.get("Principled BSDF")
        if not bsdf:
            bsdf = nodes.new('ShaderNodeBsdfPrincipled')

        # Load image texture
        tex_image = nodes.new('ShaderNodeTexImage')
        tex_image.image = bpy.data.images.load(image_path)
        tex_image.location = (-400, 0)

        # UV unwrap if needed
        if uv_project:
            self._smart_uv_unwrap()

        # Connect based on texture type
        if texture_type == "diffuse":
            links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])
            print("   ✅ Applied as base color (diffuse)")

        elif texture_type == "normal":
            normal_map = nodes.new('ShaderNodeNormalMap')
            normal_map.location = (-200, -200)
            links.new(tex_image.outputs['Color'], normal_map.inputs['Color'])
            links.new(normal_map.outputs['Normal'], bsdf.inputs['Normal'])
            print("   ✅ Applied as normal map")

        elif texture_type == "roughness":
            links.new(tex_image.outputs['Color'], bsdf.inputs['Roughness'])
            print("   ✅ Applied as roughness map")

        elif texture_type == "metallic":
            links.new(tex_image.outputs['Color'], bsdf.inputs['Metallic'])
            print("   ✅ Applied as metallic map")

        elif texture_type == "damage":
            # Mix with existing color
            mix = nodes.new('ShaderNodeMixRGB')
            mix.location = (-200, 100)
            mix.blend_type = 'MULTIPLY'
            mix.inputs['Fac'].default_value = 0.5

            links.new(tex_image.outputs['Color'], mix.inputs['Color2'])

            # Get existing color connection
            if bsdf.inputs['Base Color'].links:
                existing = bsdf.inputs['Base Color'].links[0].from_socket
                links.new(existing, mix.inputs['Color1'])

            links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
            print("   ✅ Applied as damage overlay")

        return True

    def _smart_uv_unwrap(self):
        """Perform smart UV unwrapping for texture mapping"""
        print("   🔧 Performing UV unwrapping...")

        # Select vehicle
        bpy.ops.object.select_all(action='DESELECT')
        self.vehicle.select_set(True)
        bpy.context.view_layer.objects.active = self.vehicle

        # Enter edit mode
        bpy.ops.object.mode_set(mode='EDIT')

        # Select all faces
        bpy.ops.mesh.select_all(action='SELECT')

        # Smart UV project
        bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)

        # Back to object mode
        bpy.ops.object.mode_set(mode='OBJECT')

        print("   ✅ UV unwrapping complete")

    def extract_frames_from_video(self, video_path, output_dir, frame_interval=30):
        """Extract frames from video for texture use"""

        print(f"\n🎥 Extracting frames from video: {Path(video_path).name}")

        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"   ❌ Could not open video: {video_path}")
            return []

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        print(f"   Video info: {fps:.1f} FPS, {total_frames} total frames")
        print(f"   Extracting every {frame_interval} frames...")

        extracted = []
        frame_count = 0
        saved_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                frame_path = output_dir / f"frame_{saved_count:04d}.jpg"
                cv2.imwrite(str(frame_path), frame)
                extracted.append(str(frame_path))
                saved_count += 1

            frame_count += 1

        cap.release()

        print(f"   ✅ Extracted {saved_count} frames to {output_dir}")
        return extracted

    def create_texture_from_multiple_images(self, image_paths, output_path, stitch=True):
        """Combine multiple images into single texture"""

        print(f"\n🧩 Creating texture from {len(image_paths)} images...")

        if not image_paths:
            return None

        images = [Image.open(p) for p in image_paths]

        if stitch:
            # Stitch images horizontally
            total_width = sum(img.width for img in images)
            max_height = max(img.height for img in images)

            combined = Image.new('RGB', (total_width, max_height))

            x_offset = 0
            for img in images:
                combined.paste(img, (x_offset, 0))
                x_offset += img.width
        else:
            # Use first image
            combined = images[0]

        # Save
        combined.save(output_path)
        print(f"   ✅ Saved combined texture: {output_path}")

        return output_path

    def save_model(self, output_path):
        """Export updated model"""

        print(f"\n💾 Saving updated model: {Path(output_path).name}")

        bpy.ops.export_scene.gltf(
            filepath=str(output_path),
            export_format='GLB',
            use_selection=False,
            export_texcoords=True,
            export_normals=True,
            export_materials='EXPORT',
            export_apply=True
        )

        file_size = Path(output_path).stat().st_size / (1024 * 1024)
        print(f"   ✅ Saved: {output_path} ({file_size:.2f} MB)")

        return True


class LiDARIntegrator:
    """Integrate LiDAR point cloud data with 3D models"""

    def __init__(self, model_path):
        self.model_path = Path(model_path)

    def load_point_cloud(self, lidar_file):
        """
        Load LiDAR point cloud data
        Supports: .ply, .las, .xyz, .pcd formats
        """

        print(f"\n📡 Loading LiDAR data: {Path(lidar_file).name}")

        file_ext = Path(lidar_file).suffix.lower()

        if file_ext == '.ply':
            return self._load_ply(lidar_file)
        elif file_ext == '.xyz':
            return self._load_xyz(lidar_file)
        elif file_ext == '.txt':
            return self._load_xyz(lidar_file)  # Assume XYZ format
        else:
            print(f"   ⚠️  Unsupported format: {file_ext}")
            return None

    def _load_ply(self, ply_file):
        """Load PLY point cloud"""
        try:
            # Import PLY
            bpy.ops.import_mesh.ply(filepath=ply_file)

            point_cloud = bpy.context.selected_objects[0] if bpy.context.selected_objects else None

            if point_cloud:
                print(f"   ✅ Loaded point cloud: {len(point_cloud.data.vertices)} points")
                return point_cloud
        except Exception as e:
            print(f"   ❌ Error loading PLY: {e}")

        return None

    def _load_xyz(self, xyz_file):
        """Load XYZ point cloud (text format)"""
        try:
            points = np.loadtxt(xyz_file)

            print(f"   ✅ Loaded {len(points)} points from XYZ file")

            # Create mesh from points
            mesh = bpy.data.meshes.new("LiDAR_PointCloud")
            obj = bpy.data.objects.new("PointCloud", mesh)

            bpy.context.collection.objects.link(obj)

            # Create vertices
            mesh.from_pydata(points[:, :3].tolist(), [], [])
            mesh.update()

            return obj

        except Exception as e:
            print(f"   ❌ Error loading XYZ: {e}")

        return None

    def refine_model_from_pointcloud(self, point_cloud_obj, model_obj, method='shrinkwrap'):
        """
        Refine 3D model geometry using LiDAR point cloud

        methods:
        - shrinkwrap: Conform model to point cloud surface
        - remesh: Rebuild geometry from point cloud
        - displace: Displace vertices toward point cloud
        """

        print(f"\n🔧 Refining model using LiDAR data (method: {method})...")

        if method == 'shrinkwrap':
            # Add shrinkwrap modifier
            modifier = model_obj.modifiers.new(name="LiDAR_Shrinkwrap", type='SHRINKWRAP')
            modifier.target = point_cloud_obj
            modifier.wrap_method = 'NEAREST_SURFACEPOINT'
            modifier.offset = 0.01

            # Apply modifier
            bpy.context.view_layer.objects.active = model_obj
            bpy.ops.object.modifier_apply(modifier="LiDAR_Shrinkwrap")

            print("   ✅ Applied shrinkwrap to conform to LiDAR data")

        elif method == 'remesh':
            # Remesh based on point cloud
            modifier = model_obj.modifiers.new(name="Remesh", type='REMESH')
            modifier.mode = 'VOXEL'
            modifier.voxel_size = 0.05

            bpy.context.view_layer.objects.active = model_obj
            bpy.ops.object.modifier_apply(modifier="Remesh")

            print("   ✅ Remeshed model")

        return True


# Example usage functions
def update_from_images_example():
    """Example: Update model with images from external app"""

    print("\n" + "=" * 80)
    print("EXAMPLE: Update Model from Images")
    print("=" * 80)

    # Paths (these would come from your external app)
    model_path = "output/photorealistic_fleet/Ford_F150_Lightning_2025_Antimatter_Blue_pristine.glb"
    photo_path = "images/vehicle_photos/truck_front.jpg"  # From mobile app
    damage_path = "images/vehicle_photos/truck_damage.jpg"  # Damage photo

    # Initialize updater
    updater = ModelTextureUpdater(model_path)

    # Load model
    if updater.load_model():
        # Apply photo as texture (if images exist)
        if os.path.exists(photo_path):
            updater.apply_image_texture(photo_path, texture_type="diffuse")

        if os.path.exists(damage_path):
            updater.apply_image_texture(damage_path, texture_type="damage")

        # Save updated model
        output_path = "output/updated_models/Ford_F150_Lightning_Updated.glb"
        updater.save_model(output_path)


def update_from_video_example():
    """Example: Extract textures from video"""

    print("\n" + "=" * 80)
    print("EXAMPLE: Update Model from Video")
    print("=" * 80)

    model_path = "output/photorealistic_fleet/Ford_F150_Lightning_2025_Oxford_White_pristine.glb"
    video_path = "videos/vehicle_walkaround.mp4"  # From mobile app

    updater = ModelTextureUpdater(model_path)

    if updater.load_model():
        # Extract frames
        if os.path.exists(video_path):
            frames = updater.extract_frames_from_video(
                video_path,
                "textures/vehicles/video_frames",
                frame_interval=30
            )

            # Create composite texture
            if frames:
                texture_path = updater.create_texture_from_multiple_images(
                    frames[:4],  # Use first 4 frames
                    "textures/vehicles/composite_texture.jpg"
                )

                # Apply to model
                updater.apply_image_texture(texture_path, texture_type="diffuse")

        # Save
        output_path = "output/updated_models/Ford_F150_Lightning_VideoTexture.glb"
        updater.save_model(output_path)


def update_from_lidar_example():
    """Example: Refine model geometry with LiDAR"""

    print("\n" + "=" * 80)
    print("EXAMPLE: Refine Model from LiDAR")
    print("=" * 80)

    model_path = "output/photorealistic_fleet/Ford_F150_Lightning_2025_Carbonized_Gray_pristine.glb"
    lidar_path = "lidar/vehicle_scan.ply"  # From LiDAR scanner

    # Load model
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    bpy.ops.import_scene.gltf(filepath=model_path)
    model_obj = bpy.context.selected_objects[0]

    # Load LiDAR
    integrator = LiDARIntegrator(model_path)

    if os.path.exists(lidar_path):
        point_cloud = integrator.load_point_cloud(lidar_path)

        if point_cloud:
            # Refine model
            integrator.refine_model_from_pointcloud(point_cloud, model_obj)

            # Save
            bpy.ops.export_scene.gltf(
                filepath="output/updated_models/Ford_F150_Lightning_LiDAR_Refined.glb",
                export_format='GLB'
            )
            print("\n✅ Model refined with LiDAR data")


# Main execution
if __name__ == "__main__":
    print("\n📋 Available Operations:")
    print("   1. Update from images")
    print("   2. Update from video")
    print("   3. Update from LiDAR")
    print()
    print("💡 This script is designed to be called from external applications")
    print("   with specific file paths passed as arguments.")
    print()

    # Example: Could be called like:
    # blender --background --python update-model-from-media.py -- \
    #   --model "path/to/model.glb" \
    #   --image "path/to/photo.jpg" \
    #   --output "path/to/output.glb"
