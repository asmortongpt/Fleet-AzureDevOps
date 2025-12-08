import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import Helmet from 'react-helmet';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import { toast } from 'react-toastify';
import { io, Socket } from 'socket.io-client';

import 'react-toastify/dist/ReactToastify.css';
import { Asset, Geofence } from '../../types';
import { getAuthHeaders } from '../../utils/auth';
import { logError, logAudit } from '../../utils/logger';
import { validateCategory, validateStatus } from '../../utils/validators';


// FedRAMP/SOC 2 compliance: Ensure secure headers
Helmet.defaultProps = {
  defaultTitle: 'Asset Location Map',
  titleTemplate: '%s - Asset Management',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { httpEquiv: 'Content-Security-Policy', content: "default-src 'self'; script-src 'self'; style-src 'self';" },
  ],
};

const AssetLocationMap: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchAssets = useCallback(async (category?: string, status?: string) => {
    try {
      const params: Record<string, string> = { tenant_id: tenantId };
      if (category && validateCategory(category)) params.category = category;
      if (status && validateStatus(status)) params.status = status;

      const response = await axios.get('/api/assets', {
        headers: getAuthHeaders(),
        params,
      });
      setAssets(response.data);
    } catch (error) {
      logError('Failed to fetch assets', error);
      toast.error('Error fetching assets');
    }
  }, [tenantId]);

  const fetchGeofences = useCallback(async () => {
    try {
      const response = await axios.get('/api/geofences', {
        headers: getAuthHeaders(),
        params: { tenant_id: tenantId },
      });
      setGeofences(response.data);
    } catch (error) {
      logError('Failed to fetch geofences', error);
      toast.error('Error fetching geofences');
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAssets();
    fetchGeofences();

    const newSocket = io(process.env.REACT_APP_WS_URL || '', {
      query: { tenant_id: tenantId },
      transports: ['websocket'],
      secure: true, // Ensure WebSocket is secure
    });

    newSocket.on('assetUpdate', (updatedAsset: Asset) => {
      setAssets((prevAssets) => prevAssets.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset));
      logAudit('Asset updated via WebSocket', updatedAsset);
    });

    newSocket.on('connect_error', (error) => {
      logError('WebSocket connection error', error);
      toast.error('WebSocket connection error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [fetchAssets, fetchGeofences, tenantId]);

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {assets.map(asset => (
        <Marker key={asset.id} position={[asset.latitude, asset.longitude]}>
          <Popup>
            <div>
              <strong>{asset.name}</strong><br />
              Last seen: {new Date(asset.lastSeen).toLocaleString()}
            </div>
          </Popup>
        </Marker>
      ))}
      {geofences.map(geofence => (
        geofence.type === 'circle' ? (
          <Circle
            key={geofence.id}
            center={[geofence.latitude, geofence.longitude]}
            radius={geofence.radius}
            pathOptions={{ color: 'blue' }}
          />
        ) : (
          <Polygon
            key={geofence.id}
            positions={geofence.coordinates}
            pathOptions={{ color: 'blue' }}
          />
        )
      ))}
    </MapContainer>
  );
};

export default AssetLocationMap;