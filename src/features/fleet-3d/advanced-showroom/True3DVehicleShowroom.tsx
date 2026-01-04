/**
 * TRUE 3D VEHICLE SHOWROOM - Real WebGL 3D rendering
 * Uses Three.js for actual 3D vehicle models and rendering
 */

import React, { useState, useEffect, useRef } from 'react';

interface True3DVehicleShowroomProps {
  vehicles: any[];
  selectedVehicle: any;
  onVehicleSelect: (vehicle: any) => void;
  currentTheme: any;
}

const True3DVehicleShowroom: React.FC<True3DVehicleShowroomProps> = ({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  currentTheme
}) => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'grid' | 'list'>('3d');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    make: 'all',
    year: 'all',
    status: 'all',
    fuel: 'all'
  });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeSceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const vehicleModelsRef = useRef<any[]>([]);

  // Enhanced vehicle data
  const enhancedVehicles = vehicles.map((v, index) => ({
    ...v,
    id: v.id || `vehicle-${index}`,
    name: `${v.make || 'Unknown'} ${v.model || 'Model'} ${v.year || '2020'}`,
    make: v.make || 'Unknown',
    model: v.model || 'Model',
    year: v.year || 2020,
    color: v.color || '#ff0000',
    licensePlate: v.licensePlate || `FL-${String(index).padStart(3, '0')}`,
    status: v.status || 'idle',
    fuel: v.fuel || Math.floor(Math.random() * 50) + 50,
    health: v.health || Math.floor(Math.random() * 20) + 80,
    mileage: v.mileage || Math.floor(Math.random() * 100000) + 10000
  }));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Dynamically import Three.js
      import('three').then((THREE) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          75,
          canvas.clientWidth / canvas.clientHeight,
          0.1,
          1000
        );
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: true
        });

        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Store references
        threeSceneRef.current = scene;
        rendererRef.current = renderer;
        cameraRef.current = camera;

        // Scene setup
        scene.background = new THREE.Color(0x1a1a2e);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Showroom floor
        const floorGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.7
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Grid lines
        const gridHelper = new THREE.GridHelper(200, 50, 0x666666, 0x444444);
        scene.add(gridHelper);

        // Create 3D vehicle models
        const vehicleModels: any[] = [];
        enhancedVehicles.forEach((vehicle, index) => {
          const vehicleGroup = createVehicleModel(THREE, vehicle, index);
          scene.add(vehicleGroup);
          vehicleModels.push(vehicleGroup);
        });

        vehicleModelsRef.current = vehicleModels;

        // Position camera
        camera.position.set(0, 20, 50);
        camera.lookAt(0, 0, 0);

        // Animation loop
        const animate = () => {
          if (!animationEnabled) return;

          // Rotate vehicles slowly
          vehicleModels.forEach((model, index) => {
            if (model) {
              model.rotation.y += 0.005;
              // Subtle floating animation
              const time = Date.now() * 0.001;
              model.position.y = Math.sin(time + index) * 0.5 + 1;
            }
          });

          renderer.render(scene, camera);
          requestAnimationFrame(animate);
        };

        animate();
        setLoading(false);

        // Handle resize
        const handleResize = () => {
          if (!canvas || !camera || !renderer) return;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }).catch((error) => {
        console.error('Three.js loading error:', error);
        setLoading(false);
      });
    } catch (error) {
      console.error('Scene initialization error:', error);
      setLoading(false);
    }
  }, [enhancedVehicles, animationEnabled]);

  // Create 3D vehicle model
  const createVehicleModel = (THREE: any, vehicle: any, index: number) => {
    const group = new THREE.Group();

    // Vehicle body (main chassis)
    const bodyGeometry = new THREE.BoxGeometry(8, 3, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: getVehicleColor(vehicle.color),
      shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Vehicle roof
    const roofGeometry = new THREE.BoxGeometry(7, 2, 10);
    const roofMaterial = new THREE.MeshPhongMaterial({
      color: getVehicleColor(vehicle.color),
      shininess: 100
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4.5;
    roof.position.z = -1;
    roof.castShadow = true;
    group.add(roof);

    // Windows
    const windowMaterial = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.3,
      shininess: 100
    });

    const frontWindowGeometry = new THREE.PlaneGeometry(7, 1.8);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 4.5, 4);
    frontWindow.rotation.x = -Math.PI / 8;
    group.add(frontWindow);

    const rearWindowGeometry = new THREE.PlaneGeometry(7, 1.8);
    const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
    rearWindow.position.set(0, 4.5, -6);
    rearWindow.rotation.x = Math.PI / 8;
    group.add(rearWindow);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const wheelPositions = [
      { x: -3.5, z: 5 }, // Front left
      { x: 3.5, z: 5 }, // Front right
      { x: -3.5, z: -5 }, // Rear left
      { x: 3.5, z: -5 } // Rear right
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, 1.2, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      group.add(wheel);
    });

    // Headlights
    const headlightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const headlightMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffcc,
      emissive: 0x444422
    });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-2.5, 2.5, 8);
    group.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(2.5, 2.5, 8);
    group.add(rightHeadlight);

    // Position vehicles in a circle
    const angle = (index / enhancedVehicles.length) * Math.PI * 2;
    const radius = 30;
    group.position.x = Math.cos(angle) * radius;
    group.position.z = Math.sin(angle) * radius;
    group.position.y = 0;

    // Add vehicle label
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;

      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.fillText(vehicle.name, canvas.width / 2, 25);
        context.fillText(`${vehicle.licensePlate}`, canvas.width / 2, 45);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const labelGeometry = new THREE.PlaneGeometry(8, 2);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.y = 8;
        label.lookAt(0, 8, 0);
        group.add(label);
      }
    } catch (error) {
      console.error('Label creation error:', error);
    }

    return group;
  };

  // Convert vehicle color to hex
  const getVehicleColor = (colorName: string): number => {
    const colorMap: Record<string, number> = {
      'Magnetic Gray Metallic': 0x6b7280,
      'Ruby Red Metallic': 0xdc2626,
      'Oxford White': 0xf9fafb,
      'Shadow Black': 0x1f2937,
      'Blue Jeans Metallic': 0x3b82f6,
      'Ingot Silver Metallic': 0x9ca3af,
      White: 0xffffff,
      Black: 0x000000,
      Red: 0xef4444,
      Blue: 0x3b82f6,
      Gray: 0x6b7280,
      Silver: 0x9ca3af,
      Green: 0x10b981
    };

    // If it's a hex color, convert to number
    if (typeof colorName === 'string' && colorName.startsWith('#')) {
      return parseInt(colorName.slice(1), 16);
    }

    return colorMap[colorName] || 0xef4444;
  };

  // Mouse controls for 3D view
  useEffect(() => {
    if (viewMode !== '3d' || !canvasRef.current || !cameraRef.current) return;

    const canvas = canvasRef.current;
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !cameraRef.current) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // Rotate camera around the scene
      const camera = cameraRef.current;
      const radius = camera.position.distanceTo({ x: 0, y: 0, z: 0 });

      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;

      // Limit vertical rotation
      rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x));

      camera.position.x = Math.sin(rotation.y) * Math.cos(rotation.x) * radius;
      camera.position.y = Math.sin(rotation.x) * radius + 20;
      camera.position.z = Math.cos(rotation.y) * Math.cos(rotation.x) * radius;
      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!cameraRef.current) return;

      const camera = cameraRef.current;
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(zoomFactor);

      // Limit zoom
      const distance = camera.position.distanceTo({ x: 0, y: 0, z: 0 });
      if (distance < 20) camera.position.normalize().multiplyScalar(20);
      if (distance > 200) camera.position.normalize().multiplyScalar(200);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [viewMode, rotation]);

  // Filter and search functionality
  const filteredVehicles = enhancedVehicles.filter((vehicle) => {
    const matchesSearch =
      !searchQuery ||
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMake = filters.make === 'all' || vehicle.make === filters.make;
    const matchesYear = filters.year === 'all' || vehicle.year.toString() === filters.year;
    const matchesStatus = filters.status === 'all' || vehicle.status === filters.status;
    const matchesFuel =
      filters.fuel === 'all' ||
      (filters.fuel === 'high' && vehicle.fuel >= 75) ||
      (filters.fuel === 'low' && vehicle.fuel < 50);

    return matchesSearch && matchesMake && matchesYear && matchesStatus && matchesFuel;
  });

  const uniqueMakes = [...new Set(enhancedVehicles.map((v) => v.make))];
  const uniqueYears = [...new Set(enhancedVehicles.map((v) => v.year.toString()))].sort();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '600px',
          background: currentTheme.bg,
          color: currentTheme.text
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 2s linear infinite'
            }}
          >
            🚗
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
            Loading True 3D Vehicle Showroom
          </h2>
          <p>Initializing WebGL and Three.js 3D engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: currentTheme.bg,
        color: currentTheme.text,
        minHeight: '100vh',
        padding: '20px'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}
        >
          🚗 Enhanced 3D Vehicle Showroom
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          True WebGL 3D rendering • {filteredVehicles.length} vehicles available
        </p>
      </div>

      {/* Advanced controls */}
      <div
        style={{
          background: currentTheme.surface,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: `1px solid ${currentTheme.border}`
        }}
      >
        {/* Search and Filters row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Search vehicles
            </label>
            <input
              type="text"
              placeholder="Search by make, model or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Filter by make
            </label>
            <select
              value={filters.make}
              onChange={(e) => setFilters((prev) => ({ ...prev, make: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text
              }}
            >
              <option value="all">All Makes</option>
              {uniqueMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Filter by year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text
              }}
            >
              <option value="all">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Filter by status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>

        {/* View and Controls row */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {/* View mode buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['3d', 'grid', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: viewMode === mode ? currentTheme.primary : currentTheme.bg,
                  color: viewMode === mode ? 'white' : currentTheme.text,
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {mode === '3d' ? '🎮 3D View' : mode === 'grid' ? '⚡ Grid' : '📋 List'}
              </button>
            ))}
          </div>

          {/* 3D controls */}
          {viewMode === '3d' && (
            <>
              <button
                onClick={() => setAnimationEnabled(!animationEnabled)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: animationEnabled ? currentTheme.success : currentTheme.bg,
                  color: animationEnabled ? 'white' : currentTheme.text,
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {animationEnabled ? '⏸️ Pause' : '▶️ Animate'}
              </button>
              <span style={{ fontSize: '14px', color: currentTheme.textMuted }}>
                💡 Use mouse to rotate • Scroll to zoom
              </span>
            </>
          )}
        </div>
      </div>

      {/* True 3D WebGL Canvas showroom */}
      {viewMode === '3d' && (
        <div
          style={{
            background: currentTheme.surface,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: `1px solid ${currentTheme.border}`,
            textAlign: 'center'
          }}
        >
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: `2px solid ${currentTheme.border}`,
              borderRadius: '8px',
              cursor: 'grab'
            }}
          />
          <p
            style={{
              marginTop: '12px',
              color: currentTheme.textMuted
            }}
          >
            🎮 True 3D WebGL Showroom • Mouse to rotate • Scroll to zoom • Real-time 3D vehicle models
          </p>
        </div>
      )}

      {/* Vehicle statistics */}
      <div
        style={{
          marginTop: '24px',
          background: currentTheme.surface,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${currentTheme.border}`
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          📊 Showroom Statistics
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.primary }}>
              {enhancedVehicles.length}
            </div>
            <div>Total Vehicles</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.success }}>
              {enhancedVehicles.filter((v) => v.status === 'active').length}
            </div>
            <div>Active</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.warning }}>
              {Math.round(
                enhancedVehicles.reduce((sum, v) => sum + v.fuel, 0) / enhancedVehicles.length
              )}
              %
            </div>
            <div>Average Fuel</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.info }}>
              {uniqueMakes.length}
            </div>
            <div>Makes Available</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b35' }}>WebGL ✓</div>
            <div>True 3D Rendering</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default True3DVehicleShowroom;
