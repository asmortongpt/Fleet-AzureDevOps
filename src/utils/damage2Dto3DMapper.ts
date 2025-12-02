import * as THREE from 'three';

export interface Photo2DPosition {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  width?: number; // optional bounding box width
  height?: number; // optional bounding box height
}

export interface CameraAngle {
  angle:
    | 'front'
    | 'rear'
    | 'left_side'
    | 'right_side'
    | 'front_left_45'
    | 'front_right_45'
    | 'rear_left_45'
    | 'rear_right_45';
  distance?: number; // Optional custom distance in meters
  height?: number; // Optional custom camera height in meters
}

export interface VehiclePart {
  name: string;
  meshName?: string; // Optional specific mesh name in 3D model
  centerPosition?: THREE.Vector3; // Optional known center position
}

export interface Position3D {
  position: THREE.Vector3;
  normal: THREE.Vector3;
}

/**
 * Utility class to map 2D photo positions to 3D vehicle model positions
 * Used for converting AI-detected damage locations to 3D markers
 */
export class Damage2Dto3DMapper {
  private vehicleModel: THREE.Group;
  private raycaster: THREE.Raycaster;

  constructor(vehicleModel: THREE.Group) {
    this.vehicleModel = vehicleModel;
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Map 2D damage position from photo to 3D position on vehicle model
   * @param photo2D - 2D position in photo (percentage coordinates)
   * @param cameraAngle - Camera angle when photo was taken
   * @param vehiclePart - Optional vehicle part for more accurate positioning
   * @returns 3D position and surface normal, or null if no intersection found
   */
  map2DTo3D(
    photo2D: Photo2DPosition,
    cameraAngle: CameraAngle,
    vehiclePart?: VehiclePart
  ): Position3D | null {
    // Step 1: Create virtual camera matching photo perspective
    const camera = this.createVirtualCamera(cameraAngle);

    // Step 2: Convert percentage coordinates to NDC (Normalized Device Coordinates)
    // NDC range: -1 to +1 for both x and y
    const ndcX = (photo2D.x / 100) * 2 - 1;
    const ndcY = -((photo2D.y / 100) * 2 - 1); // Flip Y axis (screen Y goes down, NDC Y goes up)

    // Step 3: Create ray from camera through 2D point
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    // Step 4: Find intersections with vehicle model
    let intersectObjects: THREE.Object3D[] = [this.vehicleModel];

    // If specific part is specified, try to find its mesh
    if (vehiclePart?.meshName) {
      const partMesh = this.findMeshByName(vehiclePart.meshName);
      if (partMesh) {
        intersectObjects = [partMesh];
      }
    }

    const intersects = this.raycaster.intersectObjects(intersectObjects, true);

    if (intersects.length === 0) {
      // No intersection found - try fallback positioning
      if (vehiclePart?.centerPosition) {
        return {
          position: vehiclePart.centerPosition.clone(),
          normal: new THREE.Vector3(0, 1, 0) // Default up normal
        };
      }
      return null;
    }

    // Step 5: Use first intersection
    const intersection = intersects[0];

    return {
      position: intersection.point.clone(),
      normal: intersection.face?.normal.clone() || new THREE.Vector3(0, 1, 0)
    };
  }

  /**
   * Batch map multiple damage positions at once
   * More efficient than calling map2DTo3D repeatedly
   */
  batchMap2DTo3D(
    damages: Array<{
      photo2D: Photo2DPosition;
      cameraAngle: CameraAngle;
      vehiclePart?: VehiclePart;
    }>
  ): Array<Position3D | null> {
    return damages.map((damage) =>
      this.map2DTo3D(damage.photo2D, damage.cameraAngle, damage.vehiclePart)
    );
  }

  /**
   * Create virtual camera matching photo perspective
   * @private
   */
  private createVirtualCamera(cameraAngle: CameraAngle): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75, // FOV - typical smartphone camera
      1, // Aspect ratio (doesn't matter for raycasting)
      0.1, // Near plane
      1000 // Far plane
    );

    // Default distance and height
    const distance = cameraAngle.distance || 5; // 5 meters from vehicle
    const height = cameraAngle.height || 1.5; // 1.5 meters (human eye level)

    // Position camera based on angle
    switch (cameraAngle.angle) {
      case 'front':
        camera.position.set(0, height, distance);
        break;

      case 'rear':
        camera.position.set(0, height, -distance);
        break;

      case 'left_side':
        camera.position.set(-distance, height, 0);
        break;

      case 'right_side':
        camera.position.set(distance, height, 0);
        break;

      case 'front_left_45':
        camera.position.set(-distance * 0.707, height, distance * 0.707);
        break;

      case 'front_right_45':
        camera.position.set(distance * 0.707, height, distance * 0.707);
        break;

      case 'rear_left_45':
        camera.position.set(-distance * 0.707, height, -distance * 0.707);
        break;

      case 'rear_right_45':
        camera.position.set(distance * 0.707, height, -distance * 0.707);
        break;

      default:
        // Default to front view
        camera.position.set(0, height, distance);
    }

    // Point camera at vehicle center (0, 1, 0 is typical vehicle center height)
    camera.lookAt(0, 1, 0);

    return camera;
  }

  /**
   * Find mesh by name in vehicle model
   * @private
   */
  private findMeshByName(name: string): THREE.Mesh | null {
    let foundMesh: THREE.Mesh | null = null;

    this.vehicleModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name.toLowerCase().includes(name.toLowerCase())) {
        foundMesh = child;
      }
    });

    return foundMesh;
  }

  /**
   * Get estimated center position for a vehicle part
   * Useful when raycast fails but we still need approximate position
   */
  static getPartCenterPosition(partName: string): THREE.Vector3 {
    // Approximate positions for common vehicle parts (relative to vehicle center)
    const partPositions: Record<string, THREE.Vector3> = {
      // Front
      front_bumper: new THREE.Vector3(0, 0.5, 2.5),
      hood: new THREE.Vector3(0, 1.0, 1.5),
      windshield: new THREE.Vector3(0, 1.5, 0.5),
      headlight: new THREE.Vector3(0.8, 0.7, 2.3),

      // Rear
      rear_bumper: new THREE.Vector3(0, 0.5, -2.5),
      trunk: new THREE.Vector3(0, 1.0, -1.5),
      rear_window: new THREE.Vector3(0, 1.5, -1.0),
      taillight: new THREE.Vector3(0.8, 0.7, -2.3),

      // Sides - Driver (left)
      driver_door: new THREE.Vector3(-1.0, 1.0, 0),
      driver_fender: new THREE.Vector3(-1.0, 0.8, 1.5),
      driver_quarter_panel: new THREE.Vector3(-1.0, 0.8, -1.5),
      driver_window: new THREE.Vector3(-1.0, 1.3, 0),

      // Sides - Passenger (right)
      passenger_door: new THREE.Vector3(1.0, 1.0, 0),
      passenger_fender: new THREE.Vector3(1.0, 0.8, 1.5),
      passenger_quarter_panel: new THREE.Vector3(1.0, 0.8, -1.5),
      passenger_window: new THREE.Vector3(1.0, 1.3, 0),

      // Top
      roof: new THREE.Vector3(0, 1.8, 0),

      // Rear doors (for sedans/SUVs)
      rear_left_door: new THREE.Vector3(-1.0, 1.0, -1.0),
      rear_right_door: new THREE.Vector3(1.0, 1.0, -1.0),

      // Mirrors
      mirror: new THREE.Vector3(1.2, 1.4, 0.5)
    };

    return partPositions[partName] || new THREE.Vector3(0, 1, 0);
  }

  /**
   * Estimate camera angle from vehicle part name
   * Useful when camera angle is not provided
   */
  static estimateCameraAngle(partName: string): CameraAngle['angle'] {
    const frontParts = [
      'front_bumper',
      'hood',
      'windshield',
      'headlight',
      'driver_fender',
      'passenger_fender'
    ];
    const rearParts = [
      'rear_bumper',
      'trunk',
      'rear_window',
      'taillight',
      'driver_quarter_panel',
      'passenger_quarter_panel'
    ];
    const leftParts = [
      'driver_door',
      'driver_window',
      'rear_left_door',
      'driver_fender',
      'driver_quarter_panel'
    ];
    const rightParts = [
      'passenger_door',
      'passenger_window',
      'rear_right_door',
      'passenger_fender',
      'passenger_quarter_panel'
    ];

    if (frontParts.includes(partName)) return 'front';
    if (rearParts.includes(partName)) return 'rear';
    if (leftParts.includes(partName)) return 'left_side';
    if (rightParts.includes(partName)) return 'right_side';

    return 'front'; // Default
  }

  /**
   * Update vehicle model reference
   * Call this if vehicle model is replaced
   */
  updateVehicleModel(newModel: THREE.Group): void {
    this.vehicleModel = newModel;
  }
}

/**
 * Helper function to create mapper and map damage in one call
 * Convenient for single-use mapping
 */
export function mapDamage2DTo3D(
  vehicleModel: THREE.Group,
  photo2D: Photo2DPosition,
  cameraAngle: CameraAngle,
  vehiclePart?: VehiclePart
): Position3D | null {
  const mapper = new Damage2Dto3DMapper(vehicleModel);
  return mapper.map2DTo3D(photo2D, cameraAngle, vehiclePart);
}
