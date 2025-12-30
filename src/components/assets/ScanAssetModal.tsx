import { BrowserMultiFormatReader, IBrowserCodeReaderOptions, Result } from '@zxing/library';
import axios from 'axios';
import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import Webcam from 'react-webcam';

import { useFleetLocalContext } from '../../context/FleetLocalContext';

import logger from '@/utils/logger';

interface ScanAssetModalProps {
  tenantId: string;
  onClose: () => void;
}

const ScanAssetModal: React.FC<ScanAssetModalProps> = ({ tenantId, onClose }) => {
  const [_scannedCode, setScannedCode] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [_location, setLocation] = useState<GeolocationPosition | null>(null);
  const { addToOfflineQueue } = useFleetLocalContext();

  const handleScan = useCallback(async (code: string) => {
    try {
      setScannedCode(code);
      const response = await axios.get(`/api/assets/${code}`, {
        params: { tenant_id: tenantId },
      });
      setAssetDetails(response.data);
      // Audit logging
      logger.debug(`Asset scanned: ${code} by tenant: ${tenantId}`);
    } catch (error) {
      logger.error('Error fetching asset details:', error);
      toast.error('Failed to fetch asset details.');
      // Add to offline queue
      if (typeof addToOfflineQueue === 'function') {
        addToOfflineQueue({ type: 'SCAN', code, tenantId });
      }
    }
  }, [tenantId, addToOfflineQueue]);

  const handleLocationCapture = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => logger.error('Error capturing location:', error),
        { enableHighAccuracy: true }
      );
    } else {
      logger.error('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleError = (error: Error) => {
    logger.error('Camera error:', error);
    toast.error('Camera error occurred.');
  };

  return (
    <div className="scan-asset-modal">
      <Helmet>
        <title>Scan Asset</title>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self';" />
        <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </Helmet>
      <Webcam
        audio={false}
        screenshotFormat="image/jpeg"
        onUserMediaError={handleError}
        onUserMedia={() => {
          const codeReader = new BrowserMultiFormatReader();
          const videoElement = document.querySelector('video') as HTMLVideoElement;
          if (videoElement) {
            codeReader.decodeFromVideoElement(videoElement, (result: Result | null, err: Error | null) => {
              if (result) {
                handleScan(result.getText());
              }
              if (err) {
                logger.error('Error decoding barcode:', err);
              }
            });
          }
        }}
      />
      <button onClick={handleLocationCapture}>Capture Location</button>
      {assetDetails && (
        <div className="asset-details">
          <h3>Asset Details</h3>
          <p>ID: {assetDetails?.id}</p>
          <p>Name: {assetDetails?.name}</p>
          <p>Description: {assetDetails?.description}</p>
        </div>
      )}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default ScanAssetModal;