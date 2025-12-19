import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { z } from 'zod';

import { checkInAsset, checkOutAsset } from '../api/assets';
import { uploadPhoto } from '../services/photo-storage.service';
import { compressToWebP } from '../utils/compressToWebP';

interface AssetCheckInOutProps {
  tenantId: string;
  onCheckInOutSuccess: () => void;
  onError: (error: Error) => void;
}

const conditionRatingSchema = z.enum(['1', '2', '3', '4', '5']);

const AssetCheckInOut: React.FC<AssetCheckInOutProps> = ({ tenantId, onCheckInOutSuccess, onError }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [conditionRating, setConditionRating] = useState<string>('3');
  const [signature, setSignature] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleTakePicture = async () => {
    if (camera) {
      const options = { quality: 0.5, base64: true };
      const data = await camera.takePictureAsync(options);
      const compressedImage = await compressToWebP(data.uri);
      setImage(compressedImage);
    }
  };

  const handleCheckInOut = async () => {
    try {
      if (!image || !location || !conditionRatingSchema.safeParse(conditionRating).success) {
        throw new Error('Missing or invalid input');
      }

      const photoUrl = await uploadPhoto(image, tenantId);
      const gpsCoords = { lat: location.coords.latitude, lng: location.coords.longitude };

      if (isCheckingIn) {
        await checkInAsset({ photoUrl, gpsCoords, conditionRating, signature, tenantId });
      } else {
        await checkOutAsset({ photoUrl, gpsCoords, conditionRating, signature, tenantId });
      }

      onCheckInOutSuccess();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('An unexpected error occurred'));
    }
  };

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return <View><Text>Requesting permissions...</Text></View>;
  }

  if (!hasCameraPermission || !hasLocationPermission) {
    return <View><Text>No access to camera or location</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={(ref) => setCamera(ref)} />
      <Button title="Take Picture" onPress={handleTakePicture} />
      {image && <Image source={{ uri: image }} style={styles.preview} />}
      <TextInput
        style={styles.input}
        placeholder="Condition Rating (1-5)"
        value={conditionRating}
        onChangeText={setConditionRating}
      />
      <TouchableOpacity style={styles.button} onPress={handleCheckInOut}>
        <Text>{isCheckingIn ? 'Check In' : 'Check Out'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: 300,
    height: 300,
    borderRadius: 4,
    overflow: 'hidden',
  },
  preview: {
    width: 100,
    height: 100,
    marginTop: 15,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    marginTop: 10,
  },
});

export default AssetCheckInOut;