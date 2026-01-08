import { Canvas } from '@react-three/fiber';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface WebGLCapabilities {
  webgl: boolean;
  webgl2: boolean;
  maxTextureSize: number;
  maxVertexTextures: number;
  maxFragmentTextures: number;
  maxVaryingVectors: number;
  maxVertexAttribs: number;
  maxRenderBufferSize: number;
  extensions: {
    astc?: boolean;
    etc1?: boolean;
    etc2?: boolean;
    pvrtc?: boolean;
    s3tc?: boolean;
    bptc?: boolean;
    rgtc?: boolean;
  };
  renderer: string;
  vendor: string;
  version: string;
}

export interface QualitySettings {
  shadows: 'off' | 'low' | 'medium' | 'high';
  reflections: 'off' | 'low' | 'medium' | 'high';
  antialiasing: 'off' | 'fxaa' | 'msaa' | 'smaa';
  postProcessing: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  geometryDetail: 'low' | 'medium' | 'high';
  maxTextureSize: 512 | 1024 | 2048 | 4096;
}

const WebGLCompatibilityContext = createContext<{
  capabilities: WebGLCapabilities | null;
  settings: QualitySettings;
  isSupported: boolean;
  updateSettings: (settings: Partial<QualitySettings>) => void;
} | null>(null);

export function detectWebGLCapabilities(): WebGLCapabilities | null {
  // Create a test canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  // Try WebGL2 first
  let gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
  const webgl2 = !!gl;
  
  // Fall back to WebGL 1
  if (!gl) {
    gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext | null;
  }
  
  if (!gl) {
    return null;
  }
  
  // Get basic parameters
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  const capabilities: WebGLCapabilities = {
    webgl: true,
    webgl2,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexTextures: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    maxFragmentTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
    version: gl.getParameter(gl.VERSION),
    extensions: {
      astc: !!gl.getExtension('WEBGL_compressed_texture_astc'),
      etc1: !!gl.getExtension('WEBGL_compressed_texture_etc1'),
      etc2: !!gl.getExtension('WEBGL_compressed_texture_etc'),
      pvrtc: !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
      s3tc: !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
      bptc: !!gl.getExtension('EXT_texture_compression_bptc'),
      rgtc: !!gl.getExtension('EXT_texture_compression_rgtc'),
    }
  };
  
  // Clean up
  canvas.remove();
  
  return capabilities;
}

export function determineOptimalSettings(capabilities: WebGLCapabilities): QualitySettings {
  // Basic mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = capabilities.maxTextureSize < 2048 || !capabilities.webgl2;
  
  if (isMobile || isLowEndDevice) {
    return {
      shadows: 'low',
      reflections: 'off',
      antialiasing: 'fxaa',
      postProcessing: false,
      textureQuality: 'low',
      geometryDetail: 'low',
      maxTextureSize: Math.min(1024, capabilities.maxTextureSize) as 512 | 1024 | 2048 | 4096,
    };
  }
  
  // High-end desktop
  if (capabilities.webgl2 && capabilities.maxTextureSize >= 4096) {
    return {
      shadows: 'high',
      reflections: 'high',
      antialiasing: 'msaa',
      postProcessing: true,
      textureQuality: 'high',
      geometryDetail: 'high',
      maxTextureSize: Math.min(4096, capabilities.maxTextureSize) as 512 | 1024 | 2048 | 4096,
    };
  }
  
  // Medium settings for everything else
  return {
    shadows: 'medium',
    reflections: 'medium',
    antialiasing: 'fxaa',
    postProcessing: true,
    textureQuality: 'medium',
    geometryDetail: 'medium',
    maxTextureSize: Math.min(2048, capabilities.maxTextureSize) as 512 | 1024 | 2048 | 4096,
  };
}

interface WebGLCompatibilityProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WebGLCompatibilityProvider({ children, fallback }: WebGLCompatibilityProviderProps) {
  const [capabilities, setCapabilities] = useState<WebGLCapabilities | null>(null);
  const [settings, setSettings] = useState<QualitySettings>({
    shadows: 'medium',
    reflections: 'medium', 
    antialiasing: 'fxaa',
    postProcessing: true,
    textureQuality: 'medium',
    geometryDetail: 'medium',
    maxTextureSize: 2048,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const caps = detectWebGLCapabilities();
    setCapabilities(caps);
    
    if (caps) {
      const optimalSettings = determineOptimalSettings(caps);
      setSettings(optimalSettings);
      
      // Store in localStorage for persistence
      localStorage.setItem('fleet-webgl-capabilities', JSON.stringify(caps));
      localStorage.setItem('fleet-quality-settings', JSON.stringify(optimalSettings));
    }
    
    setIsInitialized(true);
  }, []);
  
  const updateSettings = (newSettings: Partial<QualitySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('fleet-quality-settings', JSON.stringify(updatedSettings));
  };
  
  if (!isInitialized) {
    return <div>Initializing 3D engine...</div>;
  }
  
  if (!capabilities) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800">WebGL Not Supported</h3>
        <p className="mt-2 text-yellow-700">
          Your browser doesn't support WebGL, which is required for 3D graphics.
          Please try updating your browser or enabling hardware acceleration.
        </p>
        {fallback && <div className="mt-4">{fallback}</div>}
      </div>
    );
  }
  
  return (
    <WebGLCompatibilityContext.Provider value={{
      capabilities,
      settings,
      isSupported: !!capabilities,
      updateSettings,
    }}>
      {children}
    </WebGLCompatibilityContext.Provider>
  );
}

export function useWebGLCapabilities() {
  const context = useContext(WebGLCompatibilityContext);
  if (!context) {
    throw new Error('useWebGLCapabilities must be used within a WebGLCompatibilityProvider');
  }
  return context;
}

// Enhanced Canvas wrapper with automatic quality settings
interface CompatibleCanvasProps extends React.ComponentProps<typeof Canvas> {
  fallback?: React.ReactNode;
}

export function CompatibleCanvas({ children, fallback, ...props }: CompatibleCanvasProps) {
  const { capabilities, settings, isSupported } = useWebGLCapabilities();
  
  if (!isSupported || !capabilities) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        {fallback || (
          <div className="text-center">
            <div className="text-gray-500 mb-2">3D View Unavailable</div>
            <div className="text-sm text-gray-400">WebGL is not supported</div>
          </div>
        )}
      </div>
    );
  }
  
  // Configure Canvas props based on capabilities
  const canvasProps = {
    ...props,
    gl: {
      antialias: settings.antialiasing !== 'off',
      alpha: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance' as const,
      failIfMajorPerformanceCaveat: false,
      ...props.gl,
    },
    dpr: Math.min(window.devicePixelRatio, 2), // Cap pixel ratio for performance
  };
  
  return (
    <Canvas {...canvasProps}>
      {children}
    </Canvas>
  );
}

// Quality settings component
export function QualitySettingsPanel() {
  const { settings, updateSettings, capabilities } = useWebGLCapabilities();
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Graphics Quality</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shadows</label>
          <select 
            value={settings.shadows} 
            onChange={(e) => updateSettings({ shadows: e.target.value as any })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="off">Off</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reflections</label>
          <select 
            value={settings.reflections} 
            onChange={(e) => updateSettings({ reflections: e.target.value as any })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="off">Off</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anti-aliasing</label>
          <select 
            value={settings.antialiasing} 
            onChange={(e) => updateSettings({ antialiasing: e.target.value as any })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="off">Off</option>
            <option value="fxaa">FXAA</option>
            {capabilities?.webgl2 && <option value="msaa">MSAA</option>}
            <option value="smaa">SMAA</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <input
            id="postProcessing"
            type="checkbox"
            checked={settings.postProcessing}
            onChange={(e) => updateSettings({ postProcessing: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="postProcessing" className="ml-2 block text-sm text-gray-700">
            Enable Post-processing Effects
          </label>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        WebGL Version: {capabilities?.webgl2 ? '2.0' : '1.0'} | 
        Max Texture Size: {capabilities?.maxTextureSize}px
      </div>
    </div>
  );
}