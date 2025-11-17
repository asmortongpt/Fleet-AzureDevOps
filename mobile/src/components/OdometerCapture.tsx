/**
 * OdometerCapture Component
 *
 * Production-ready odometer reading OCR with:
 * - Camera with odometer overlay guide
 * - Real-time digit recognition
 * - Manual correction interface
 * - Historical comparison alerts
 * - Link to trip/reservation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import OCRService, { OdometerData } from '../services/OCRService';

// Validation schema
const OdometerSchema = z.object({
  reading: z.number().positive('Odometer reading must be positive'),
  unit: z.enum(['miles', 'kilometers']),
});

interface OdometerCaptureProps {
  vehicleId: string;
  tripId?: string;
  reservationId?: string;
  lastReading?: number;
  lastReadingDate?: string;
  onSave: (data: OdometerData & { photoUri: string }) => Promise<void>;
  onCancel: () => void;
}

export const OdometerCapture: React.FC<OdometerCaptureProps> = ({
  vehicleId,
  tripId,
  reservationId,
  lastReading,
  lastReadingDate,
  onSave,
  onCancel,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OdometerData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const cameraRef = useRef<Camera>(null);

  const [formData, setFormData] = useState({
    reading: '',
    unit: 'miles' as 'miles' | 'kilometers',
    notes: '',
  });

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasPermission(cameraStatus === 'granted' && libraryStatus === 'granted');
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
      });

      setPhotoUri(photo.uri);
      setCameraVisible(false);
      await processOdometer(photo.uri);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        await processOdometer(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processOdometer = async (uri: string) => {
    setIsProcessing(true);
    try {
      const result = await OCRService.processOdometer(uri);

      setOcrResult(result);

      // Pre-fill form with OCR data
      setFormData({
        reading: result.reading?.toString() || '',
        unit: result.unit || 'miles',
        notes: '',
      });

      // Validate against last reading
      if (lastReading && result.reading) {
        if (result.reading < lastReading) {
          setAlertMessage(
            `⚠️ Warning: New reading (${result.reading.toLocaleString()}) is less than last reading (${lastReading.toLocaleString()}). Please verify.`
          );
          setShowAlert(true);
          setEditMode(true);
        } else if (result.reading - lastReading > 1000) {
          setAlertMessage(
            `⚠️ Notice: Large increase (${(result.reading - lastReading).toLocaleString()} ${result.unit}) since last reading. Please verify.`
          );
          setShowAlert(true);
        }
      }

      // Check confidence
      if (result.confidence && result.confidence < 0.85) {
        Alert.alert(
          'Low Confidence',
          'Odometer reading has low confidence. Please review and correct if needed.',
          [{ text: 'Review Now', onPress: () => setEditMode(true) }]
        );
      }
    } catch (error) {
      console.error('Error processing odometer:', error);
      Alert.alert(
        'OCR Error',
        'Failed to extract odometer reading. You can enter it manually.',
        [{ text: 'Enter Manually', onPress: () => setEditMode(true) }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      OdometerSchema.parse({
        reading: parseFloat(formData.reading),
        unit: formData.unit,
      });

      // Additional validation
      const reading = parseFloat(formData.reading);
      if (lastReading && reading < lastReading) {
        setErrors({
          reading: `Reading cannot be less than last reading (${lastReading})`,
        });
        return false;
      }

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !photoUri) return;

    try {
      setIsProcessing(true);
      await onSave({
        reading: parseFloat(formData.reading),
        unit: formData.unit,
        confidence: ocrResult?.confidence || 0,
        vehicleId,
        tripId,
        reservationId,
        notes: formData.notes,
        photoUri,
      });
      Alert.alert('Success', 'Odometer reading saved successfully');
    } catch (error) {
      console.error('Error saving odometer:', error);
      Alert.alert('Error', 'Failed to save odometer reading');
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return '#4CAF50';
    if (confidence >= 0.8) return '#FFC107';
    return '#F44336';
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.container}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
          ratio="4:3"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.odometerGuide}>
              <Text style={styles.guideText}>
                Position odometer display here
              </Text>
              <View style={styles.digitBoxes}>
                {[...Array(7)].map((_, i) => (
                  <View key={i} style={styles.digitBox} />
                ))}
              </View>
            </View>
            <Text style={styles.instructionText}>
              Ensure numbers are clear and well-lit
            </Text>
          </View>
        </Camera>
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCameraVisible(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePhoto}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <View style={styles.spacer} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Odometer Reading</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {lastReading && (
        <View style={styles.historyCard}>
          <Text style={styles.historyLabel}>Last Reading</Text>
          <Text style={styles.historyValue}>
            {lastReading.toLocaleString()} miles
          </Text>
          {lastReadingDate && (
            <Text style={styles.historyDate}>
              on {new Date(lastReadingDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {!photoUri ? (
        <View style={styles.captureSection}>
          <Text style={styles.instructionHeader}>
            Take a photo of your odometer display
          </Text>
          <Text style={styles.instructionSubtext}>
            Make sure the numbers are clearly visible
          </Text>
          <TouchableOpacity
            style={styles.captureOption}
            onPress={() => setCameraVisible(true)}
          >
            <Text style={styles.captureOptionText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureOption}
            onPress={handlePickImage}
          >
            <Text style={styles.captureOptionText}>🖼️ Choose from Library</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.imagePreview}>
            <Image source={{ uri: photoUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setPhotoUri(null);
                setOcrResult(null);
                setEditMode(false);
                setShowAlert(false);
              }}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>
                Reading odometer digits...
              </Text>
            </View>
          ) : ocrResult || editMode ? (
            <View style={styles.formContainer}>
              {showAlert && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertText}>{alertMessage}</Text>
                  <TouchableOpacity
                    onPress={() => setShowAlert(false)}
                    style={styles.alertClose}
                  >
                    <Text style={styles.alertCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {ocrResult?.confidence && (
                <View style={styles.confidenceCard}>
                  <Text style={styles.confidenceLabel}>Confidence Score</Text>
                  <View
                    style={[
                      styles.confidenceBar,
                      {
                        backgroundColor: getConfidenceColor(
                          ocrResult.confidence
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.confidenceValue}>
                      {(ocrResult.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Odometer Reading *</Text>
                <View style={styles.readingInputContainer}>
                  <TextInput
                    style={[
                      styles.readingInput,
                      errors.reading && styles.inputError,
                      !editMode && styles.inputDisabled,
                    ]}
                    value={formData.reading}
                    onChangeText={(text) => {
                      // Only allow numbers and decimal point
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      setFormData({ ...formData, reading: cleaned });
                    }}
                    placeholder="000000"
                    keyboardType="decimal-pad"
                    editable={editMode}
                    maxLength={10}
                  />
                  <Text style={styles.unitText}>{formData.unit}</Text>
                </View>
                {errors.reading && (
                  <Text style={styles.errorMessage}>{errors.reading}</Text>
                )}
                {!editMode && ocrResult?.reading && lastReading && (
                  <Text style={styles.differenceText}>
                    +{(ocrResult.reading - lastReading).toLocaleString()}{' '}
                    {formData.unit} since last reading
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitSelector}>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      formData.unit === 'miles' && styles.unitButtonActive,
                      !editMode && styles.unitButtonDisabled,
                    ]}
                    onPress={() =>
                      editMode &&
                      setFormData({ ...formData, unit: 'miles' })
                    }
                    disabled={!editMode}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        formData.unit === 'miles' &&
                          styles.unitButtonTextActive,
                      ]}
                    >
                      Miles
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      formData.unit === 'kilometers' &&
                        styles.unitButtonActive,
                      !editMode && styles.unitButtonDisabled,
                    ]}
                    onPress={() =>
                      editMode &&
                      setFormData({ ...formData, unit: 'kilometers' })
                    }
                    disabled={!editMode}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        formData.unit === 'kilometers' &&
                          styles.unitButtonTextActive,
                      ]}
                    >
                      Kilometers
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {(tripId || reservationId) && (
                <View style={styles.linkCard}>
                  <Text style={styles.linkLabel}>Linked To</Text>
                  {tripId && (
                    <Text style={styles.linkValue}>Trip #{tripId}</Text>
                  )}
                  {reservationId && (
                    <Text style={styles.linkValue}>
                      Reservation #{reservationId}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    !editMode && styles.inputDisabled,
                  ]}
                  value={formData.notes}
                  onChangeText={(text) =>
                    setFormData({ ...formData, notes: text })
                  }
                  placeholder="Optional notes..."
                  multiline
                  numberOfLines={3}
                  editable={editMode}
                />
              </View>

              <View style={styles.actionButtons}>
                {!editMode ? (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditMode(true)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      💾 Save Reading
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  historyCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  historyLabel: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  historyDate: {
    fontSize: 12,
    color: '#42A5F5',
    marginTop: 4,
  },
  captureSection: {
    padding: 20,
  },
  instructionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  captureOption: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captureOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  odometerGuide: {
    width: '85%',
    padding: 20,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  digitBoxes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  digitBox: {
    width: 32,
    height: 48,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#666',
    borderRadius: 8,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#ddd',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  spacer: {
    width: 70,
  },
  imagePreview: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
  },
  retakeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  processingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    padding: 16,
  },
  alertBox: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
  },
  alertClose: {
    padding: 4,
  },
  alertCloseText: {
    fontSize: 18,
    color: '#856404',
    fontWeight: 'bold',
  },
  confidenceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  confidenceBar: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confidenceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  readingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingRight: 16,
  },
  readingInput: {
    flex: 1,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  inputError: {
    borderColor: '#F44336',
  },
  differenceText: {
    marginTop: 6,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  errorMessage: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonDisabled: {
    opacity: 0.6,
  },
  unitButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  linkCard: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  linkLabel: {
    fontSize: 12,
    color: '#7B1FA2',
    fontWeight: '600',
    marginBottom: 4,
  },
  linkValue: {
    fontSize: 14,
    color: '#6A1B9A',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    padding: 20,
  },
});

export default OdometerCapture;
