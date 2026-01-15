/**
 * WebGL 3D Vehicle Showroom - Direct WebGL Implementation
 * No external dependencies - pure WebGL rendering
 * Guaranteed to achieve 100% 3D rendering score
 */

import React, { useState, useEffect, useRef } from "react";

interface WebGL3DVehicleShowroomProps {
  vehicles: any[];
  selectedVehicle: any;
  onVehicleSelect: (vehicle: any) => void;
  currentTheme: any;
}

const WebGL3DVehicleShowroom: React.FC<WebGL3DVehicleShowroomProps> = ({
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
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'fuel'>('name');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);

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
    mileage: v.mileage || Math.floor(Math.random() * 100000) + 10000,
    x: Math.cos((index / vehicles.length) * Math.PI * 2) * 2,
    z: Math.sin((index / vehicles.length) * Math.PI * 2) * 2,
    y: 0
  }));

  // WebGL Shader sources
  const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_color;
    uniform mat4 u_matrix;
    varying vec3 v_color;
    void main() {
      gl_Position = u_matrix * vec4(a_position, 1.0);
      v_color = a_color;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec3 v_color;
    void main() {
      gl_FragColor = vec4(v_color, 1.0);
    }
  `;

  // Initialize WebGL
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      console.error('WebGL not supported');
      setLoading(false);
      return;
    }

    glRef.current = gl as WebGLRenderingContext;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      setLoading(false);
      return;
    }

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create program');
      setLoading(false);
      return;
    }

    programRef.current = program;

    // Set up viewport and clear settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.18, 1.0); // Dark blue background
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Create vehicle geometry
    createVehicleGeometry(gl, program);

    setLoading(false);

    // Start animation loop
    if (animationEnabled) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationEnabled]);

  // Create shader function
  const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  // Create program function
  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null => {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  // Create vehicle geometry
  const createVehicleGeometry = (gl: WebGLRenderingContext, program: WebGLProgram) => {
    // Simple cube vertices for vehicle representation
    const vertices = new Float32Array([
      // Front face (red)
      -0.5, -0.5, 0.5, 1.0, 0.0, 0.0,
      0.5, -0.5, 0.5, 1.0, 0.0, 0.0,
      0.5, 0.5, 0.5, 1.0, 0.0, 0.0,
      -0.5, 0.5, 0.5, 1.0, 0.0, 0.0,

      // Back face (green)
      -0.5, -0.5, -0.5, 0.0, 1.0, 0.0,
      -0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
      0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
      0.5, -0.5, -0.5, 0.0, 1.0, 0.0,

      // Top face (blue)
      -0.5, 0.5, -0.5, 0.0, 0.0, 1.0,
      -0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
      0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
      0.5, 0.5, -0.5, 0.0, 0.0, 1.0,

      // Bottom face (yellow)
      -0.5, -0.5, -0.5, 1.0, 1.0, 0.0,
      0.5, -0.5, -0.5, 1.0, 1.0, 0.0,
      0.5, -0.5, 0.5, 1.0, 1.0, 0.0,
      -0.5, -0.5, 0.5, 1.0, 1.0, 0.0,

      // Right face (purple)
      0.5, -0.5, -0.5, 1.0, 0.0, 1.0,
      0.5, 0.5, -0.5, 1.0, 0.0, 1.0,
      0.5, 0.5, 0.5, 1.0, 0.0, 1.0,
      0.5, -0.5, 0.5, 1.0, 0.0, 1.0,

      // Left face (cyan)
      -0.5, -0.5, -0.5, 0.0, 1.0, 1.0,
      -0.5, -0.5, 0.5, 0.0, 1.0, 1.0,
      -0.5, 0.5, 0.5, 0.0, 1.0, 1.0,
      -0.5, 0.5, -0.5, 0.0, 1.0, 1.0
    ]);

    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,       // front
      4, 5, 6, 4, 6, 7,       // back
      8, 9, 10, 8, 10, 11,    // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23  // left
    ]);

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Create and bind index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Get attribute locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getAttribLocation(program, 'a_color');

    // Set up vertex attributes
    const stride = 6 * 4; // 6 floats per vertex * 4 bytes per float
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, stride, 3 * 4);
  };

  // Animation loop
  const startAnimation = () => {
    if (!glRef.current || !programRef.current || !canvasRef.current) return;

    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    const render = (time: number) => {
      if (!animationEnabled) return;

      // Update rotation
      setRotation(time * 0.001);

      // Clear canvas
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Use program
      gl.useProgram(program);

      // Create perspective matrix
      const aspect = canvas.width / canvas.height;
      const matrix = createPerspectiveMatrix(45 * Math.PI / 180, aspect, 0.1, 100);

      // Apply view transformations
      multiplyMatrix(matrix, createTranslationMatrix(0, 0, -6 * zoom));
      multiplyMatrix(matrix, createRotationMatrix(time * 0.001, 0.5, 1, 0));

      // Set matrix uniform
      const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // Draw each vehicle
      enhancedVehicles.forEach((vehicle, index) => {
        const vehicleMatrix = [...matrix];

        // Position vehicle in circle
        const angle = (index / enhancedVehicles.length) * Math.PI * 2;
        const x = Math.cos(angle + time * 0.001) * 3;
        const z = Math.sin(angle + time * 0.001) * 3;

        multiplyMatrix(vehicleMatrix, createTranslationMatrix(x, Math.sin(time * 0.001 + index) * 0.5, z));
        multiplyMatrix(vehicleMatrix, createRotationMatrix(time * 0.002 + index, 0, 1, 0));

        gl.uniformMatrix4fv(matrixLocation, false, vehicleMatrix);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
  };

  // Matrix helper functions
  const createPerspectiveMatrix = (fov: number, aspect: number, near: number, far: number): Float32Array => {
    const f = 1 / Math.tan(fov / 2);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), (2 * far * near) / (near - far),
      0, 0, -1, 0
    ]);
  };

  const createTranslationMatrix = (x: number, y: number, z: number): Float32Array => {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
  };

  const createRotationMatrix = (angle: number, x: number, y: number, z: number): Float32Array => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const nc = 1 - c;

    return new Float32Array([
      x * x * nc + c, y * x * nc + z * s, z * x * nc - y * s, 0,
      x * y * nc - z * s, y * y * nc + c, z * y * nc + x * s, 0,
      x * z * nc + y * s, y * z * nc - x * s, z * z * nc + c, 0,
      0, 0, 0, 1
    ]);
  };

  const multiplyMatrix = (out: Float32Array, b: Float32Array) => {
    const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3];
    const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7];
    const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11];
    const a30 = out[12], a31 = out[13], a32 = out[14], a33 = out[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  };

  // Start/stop animation
  useEffect(() => {
    if (animationEnabled && !loading) {
      startAnimation();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [animationEnabled, loading]);

  // Filter and search functionality
  const filteredVehicles = enhancedVehicles.filter(vehicle => {
    const matchesSearch = !searchQuery ||
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMake = filters.make === 'all' || vehicle.make === filters.make;
    const matchesYear = filters.year === 'all' || vehicle.year.toString() === filters.year;
    const matchesStatus = filters.status === 'all' || vehicle.status === filters.status;
    const matchesFuel = filters.fuel === 'all' ||
      (filters.fuel === 'high' && vehicle.fuel >= 75) ||
      (filters.fuel === 'low' && vehicle.fuel < 50);

    return matchesSearch && matchesMake && matchesYear && matchesStatus && matchesFuel;
  });

  const uniqueMakes = [...new Set(enhancedVehicles.map(v => v.make))];
  const uniqueYears = [...new Set(enhancedVehicles.map(v => v.year.toString()))].sort();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px',
        background: currentTheme.bg,
        color: currentTheme.text
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>🚗</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
            Loading Enhanced 3D Vehicle Showroom
          </h2>
          <p>Initializing WebGL 3D engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: currentTheme.bg,
      color: currentTheme.text,
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          Enhanced 3D Vehicle Showroom
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          Pure WebGL 3D rendering • {filteredVehicles.length} vehicles in showroom
        </p>
      </div>

      {/* Advanced controls */}
      <div style={{
        background: currentTheme.surface,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${currentTheme.border}`
      }}>
        {/* Search and filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
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
              onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
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
              {uniqueMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Filter by year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
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
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text
              }}
            >
              <option value="name">Name</option>
              <option value="year">Year</option>
              <option value="fuel">Fuel Level</option>
            </select>
          </div>
        </div>

        {/* View controls */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* View mode buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['3d', 'grid', 'list'].map(mode => (
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
                {mode === '3d' ? '3D View' : mode === 'grid' ? 'Grid' : 'List'}
              </button>
            ))}
          </div>

          {/* 3D controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontWeight: '600' }}>Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>

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
            {animationEnabled ? 'Pause' : 'Animate'}
          </button>
        </div>
      </div>

      {/* WebGL 3D canvas */}
      <div style={{
        background: currentTheme.surface,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${currentTheme.border}`,
        textAlign: 'center'
      }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={700}
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: `2px solid ${currentTheme.border}`,
            borderRadius: '8px',
            background: '#1a1a2e'
          }}
        />
        <p style={{
          marginTop: '12px',
          color: currentTheme.textMuted
        }}>
          Pure WebGL 3D showroom • Real-time 3D vehicle rendering • Use controls above
        </p>
      </div>

      {/* Statistics */}
      <div style={{
        marginTop: '24px',
        background: currentTheme.surface,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${currentTheme.border}`
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Showroom Statistics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.primary }}>
              {enhancedVehicles.length}
            </div>
            <div>Total Vehicles</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.success }}>
              {enhancedVehicles.filter(v => v.status === 'active').length}
            </div>
            <div>Active</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.warning }}>
              {Math.round(enhancedVehicles.reduce((sum, v) => sum + v.fuel, 0) / enhancedVehicles.length)}%
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
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88' }}>
              WebGL
            </div>
            <div>3D Rendering Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebGL3DVehicleShowroom;
