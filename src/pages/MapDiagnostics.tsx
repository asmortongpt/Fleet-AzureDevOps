import { useEffect, useState } from 'react';

export default function MapDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});
  const [mapStatus, setMapStatus] = useState<string>('Testing...');

  useEffect(() => {
    // Collect diagnostic information
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    const diag = {
      'Environment Variables': {
        'VITE_GOOGLE_MAPS_API_KEY': apiKey ? `${apiKey.substring(0, 20)}... (${apiKey.length} chars)` : '❌ NOT FOUND',
        'VITE_API_BASE_URL': baseUrl || '❌ NOT FOUND',
        'MODE': import.meta.env.MODE,
        'DEV': import.meta.env.DEV,
        'PROD': import.meta.env.PROD,
      },
      'Browser Info': {
        'User Agent': navigator.userAgent,
        'Language': navigator.language,
        'Online': navigator.onLine,
      },
      'Window Globals': {
        'window.google': typeof window.google !== 'undefined' ? '✅ Loaded' : '❌ Not loaded',
        'window.google.maps': typeof (window as any).google?.maps !== 'undefined' ? '✅ Loaded' : '❌ Not loaded',
      }
    };

    setDiagnostics(diag);

    // Test loading Google Maps
    if (apiKey) {
      loadGoogleMaps(apiKey);
    } else {
      setMapStatus('❌ No API key found in environment variables');
    }
  }, []);

  const loadGoogleMaps = (apiKey: string) => {
    setMapStatus('Loading Google Maps script...');

    // Check if already loaded
    if ((window as any).google?.maps) {
      setMapStatus('✅ Google Maps already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;

    script.onload = () => {
      setMapStatus('✅ Google Maps loaded successfully');

      // Try to create a map
      setTimeout(() => {
        const testDiv = document.getElementById('test-map');
        if (testDiv && (window as any).google?.maps) {
          try {
            new (window as any).google.maps.Map(testDiv, {
              center: { lat: 30.4383, lng: -84.2807 },
              zoom: 12,
            });
            setMapStatus('✅ Google Maps loaded and map created successfully!');
          } catch (error) {
            setMapStatus(`❌ Map creation failed: ${error}`);
          }
        }
      }, 100);
    };

    script.onerror = (error) => {
      setMapStatus(`❌ Failed to load Google Maps script: ${error}`);
    };

    document.head.appendChild(script);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Google Maps Diagnostics</h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-xl font-semibold mb-2">Map Loading Status</h2>
        <p className="text-lg font-mono">{mapStatus}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Test Map</h2>
        <div
          id="test-map"
          style={{ width: '100%', height: '400px', border: '2px solid #ccc', borderRadius: '8px' }}
        />
      </div>

      <div className="space-y-6">
        {Object.entries(diagnostics).map(([category, items]) => (
          <div key={category} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">{category}</h2>
            <dl className="space-y-2">
              {Object.entries(items as Record<string, any>).map(([key, value]) => (
                <div key={key} className="flex border-b border-gray-200 py-2">
                  <dt className="font-medium w-1/3">{key}:</dt>
                  <dd className="font-mono text-sm w-2/3 break-all">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Quick Checks:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>If you see "NOT FOUND" for API key - the .env.local file is not being read by Vite</li>
          <li>If API key is present but map doesn't load - check browser console for errors</li>
          <li>If you see CORS errors - the API key may have referrer restrictions</li>
          <li>If you see authentication errors - the API key may be invalid or disabled</li>
        </ul>
      </div>
    </div>
  );
}
