import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import { checkInAsset, checkOutAsset } from '../api/assets';
import photoStorageService from '@/services/photo-storage.service';
import { compressToWebP } from '@/utils/compressToWebP';

interface AssetCheckInOutProps {
  tenantId: string;
  onCheckInOutSuccess: () => void;
  onError: (error: Error) => void;
}

const conditionRatingSchema = z.enum(['1', '2', '3', '4', '5']);

const AssetCheckInOut: React.FC<AssetCheckInOutProps> = ({ tenantId, onCheckInOutSuccess, onError }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<typeof Camera | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [_location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [conditionRating, setConditionRating] = useState<string>('3');
  const [_signature, setSignature] = useState<string | null>(null);
  const [_isCheckingIn, setIsCheckingIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleTakePicture = async () => {
    if (camera) {
      const options = { quality: 0.5, base64: true };
      const data = await camera.takePictureAsync(options);
      if (data?.uri) {
        const compressedImage = await compressToWebP(data.uri);
        // Convert Blob to data URL or URI string
        if (compressedImage instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(compressedImage);
        } else if (typeof compressedImage === 'string') {
          setImage(compressedImage);
        }
      }
    }
  };

  const handleCheckInOut = async () => {
    try {
      if (!image || !_location || !conditionRatingSchema.safeParse(conditionRating).success) {
        throw new Error('Missing or invalid input');
      }

      const photoUrl = await uploadPhoto(image, tenantId);
      const gpsCoords = { lat: _location.coords?.latitude ?? 0, lng: _location.coords?.longitude ?? 0 };

      // Create properly typed payload
      const payload = {
        photoUrl: typeof photoUrl === 'string' ? photoUrl : '',
        gpsCoords,
        conditionRating,
        signature: _signature || '',
        tenantId
      };

      if (_isCheckingIn) {
        // checkInAsset expects (data, options) - provide empty options object
        await checkInAsset(payload as any, {});
      } else {
        // checkOutAsset expects (data, options) - provide empty options object
        await checkOutAsset(payload as any, {});
      }

      onCheckInOutSuccess();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('An unexpected error occurred'));
    }
  };

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return <div>Requesting permissions...</div>;
  }

  if (!hasCameraPermission || !hasLocationPermission) {
    return <div>No access to camera or location</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <video
        style={{ width: 300, height: 300, borderRadius: 4, overflow: 'hidden' }}
        ref={(ref) => {
          if (ref) {
            setCamera(ref as any);
          }
        }}
      />
      <button onClick={handleTakePicture}>Take Picture</button>
      {image && <img src={image} style={{ width: 100, height: 100, marginTop: 15 }} alt="Preview" />}
      <input
        style={{ height: 40, margin: 12, borderWidth: 1, padding: 10, border: '1px solid #ccc' }}
        placeholder="Condition Rating (1-5)"
        value={conditionRating}
        onChange={(e) => setConditionRating(e.target.value)}
      />
      <button
        style={{ alignItems: 'center', backgroundColor: '#DDDDDD', padding: 10, marginTop: 10 }}
        onClick={handleCheckInOut}
      >
        {_isCheckingIn ? 'Check In' : 'Check Out'}
      </button>
    </div>
  );
};

export default AssetCheckInOut;