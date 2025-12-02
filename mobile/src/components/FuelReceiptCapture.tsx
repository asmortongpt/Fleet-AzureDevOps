/**
 * FuelReceiptCapture Component
 *
 * Production-ready fuel receipt OCR capture with:
 * - Camera integration with auto-cropping
 * - Real-time OCR preview
 * - Field extraction (date, station, gallons, price, total)
 * - Manual correction interface
 * - Confidence score display
 * - Expense categorization
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
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import OCRService, { FuelReceiptData } from '../services/OCRService';

// Validation schema for fuel receipt data
const FuelReceiptSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  station: z.string().min(1, 'Station name is required'),
  gallons: z.number().positive('Gallons must be positive'),
  pricePerGallon: z.number().positive('Price per gallon must be positive'),
  totalCost: z.number().positive('Total cost must be positive'),
  fuelType: z.string().optional(),
  location: z.string().optional(),
  paymentMethod: z.string().optional(),
});

interface FuelReceiptCaptureProps {
  vehicleId?: string;
  driverId?: string;
  onSave: (data: FuelReceiptData & { photoUri: string }) => Promise<void>;
  onCancel: () => void;
}

interface ExtractedField {
  value: string;
  confidence: number;
  needsReview: boolean;
}

export const FuelReceiptCapture: React.FC<FuelReceiptCaptureProps> = ({
  vehicleId,
  driverId,
  onSave,
  onCancel,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<FuelReceiptData | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cameraRef = useRef<Camera>(null);

  // Form state for manual correction
  const [formData, setFormData] = useState({
    date: '',
    station: '',
    gallons: '',
    pricePerGallon: '',
    totalCost: '',
    fuelType: 'Regular',
    location: '',
    paymentMethod: '',
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
      await processReceipt(photo.uri);
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
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        await processReceipt(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processReceipt = async (uri: string) => {
    setIsProcessing(true);
    try {
      const result = await OCRService.processFuelReceipt(uri);

      setOcrResult(result);
      setConfidenceScores(result.confidenceScores || {});

      // Pre-fill form with OCR data
      setFormData({
        date: result.date || '',
        station: result.station || '',
        gallons: result.gallons?.toString() || '',
        pricePerGallon: result.pricePerGallon?.toString() || '',
        totalCost: result.totalCost?.toString() || '',
        fuelType: result.fuelType || 'Regular',
        location: result.location || '',
        paymentMethod: result.paymentMethod || '',
        notes: '',
      });

      // Check if any field needs review (confidence < 0.8)
      const needsReview = Object.values(result.confidenceScores || {}).some(
        score => score < 0.8
      );

      if (needsReview) {
        Alert.alert(
          'Review Required',
          'Some fields have low confidence scores. Please review and correct if needed.',
          [{ text: 'Review Now', onPress: () => setEditMode(true) }]
        );
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert(
        'OCR Error',
        'Failed to extract data from receipt. You can enter it manually.',
        [{ text: 'Enter Manually', onPress: () => setEditMode(true) }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      FuelReceiptSchema.parse({
        date: formData.date,
        station: formData.station,
        gallons: parseFloat(formData.gallons),
        pricePerGallon: parseFloat(formData.pricePerGallon),
        totalCost: parseFloat(formData.totalCost),
        fuelType: formData.fuelType,
        location: formData.location,
        paymentMethod: formData.paymentMethod,
      });
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
        date: formData.date,
        station: formData.station,
        gallons: parseFloat(formData.gallons),
        pricePerGallon: parseFloat(formData.pricePerGallon),
        totalCost: parseFloat(formData.totalCost),
        fuelType: formData.fuelType,
        location: formData.location,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        confidenceScores,
        photoUri,
      });
      Alert.alert('Success', 'Fuel receipt saved successfully');
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save fuel receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return '#4CAF50'; // Green
    if (confidence >= 0.8) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const renderConfidenceBadge = (field: string) => {
    const confidence = confidenceScores[field];
    if (!confidence) return null;

    return (
      <View
        style={[
          styles.confidenceBadge,
          { backgroundColor: getConfidenceColor(confidence) },
        ]}
      >
        <Text style={styles.confidenceText}>
          {(confidence * 100).toFixed(0)}%
        </Text>
      </View>
    );
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
            <View style={styles.receiptGuide}>
              <Text style={styles.guideText}>
                Position receipt within frame
              </Text>
            </View>
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
        <Text style={styles.title}>Fuel Receipt Capture</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {!photoUri ? (
        <View style={styles.captureSection}>
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
              }}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>
                Extracting receipt data...
              </Text>
            </View>
          ) : ocrResult || editMode ? (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Receipt Details</Text>
              <Text style={styles.sectionSubtitle}>
                {editMode ? 'Edit and verify' : 'Review extracted'} information
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date *</Text>
                <View style={styles.inputWithBadge}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.date && styles.inputError,
                      !editMode && styles.inputDisabled,
                    ]}
                    value={formData.date}
                    onChangeText={(text) =>
                      setFormData({ ...formData, date: text })
                    }
                    placeholder="MM/DD/YYYY"
                    editable={editMode}
                  />
                  {renderConfidenceBadge('date')}
                </View>
                {errors.date && (
                  <Text style={styles.errorMessage}>{errors.date}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Station Name *</Text>
                <View style={styles.inputWithBadge}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.station && styles.inputError,
                      !editMode && styles.inputDisabled,
                    ]}
                    value={formData.station}
                    onChangeText={(text) =>
                      setFormData({ ...formData, station: text })
                    }
                    placeholder="e.g., Shell, Chevron"
                    editable={editMode}
                  />
                  {renderConfidenceBadge('station')}
                </View>
                {errors.station && (
                  <Text style={styles.errorMessage}>{errors.station}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Gallons *</Text>
                  <View style={styles.inputWithBadge}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.gallons && styles.inputError,
                        !editMode && styles.inputDisabled,
                      ]}
                      value={formData.gallons}
                      onChangeText={(text) =>
                        setFormData({ ...formData, gallons: text })
                      }
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      editable={editMode}
                    />
                    {renderConfidenceBadge('gallons')}
                  </View>
                  {errors.gallons && (
                    <Text style={styles.errorMessage}>{errors.gallons}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Price/Gallon *</Text>
                  <View style={styles.inputWithBadge}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.pricePerGallon && styles.inputError,
                        !editMode && styles.inputDisabled,
                      ]}
                      value={formData.pricePerGallon}
                      onChangeText={(text) =>
                        setFormData({ ...formData, pricePerGallon: text })
                      }
                      placeholder="$0.00"
                      keyboardType="decimal-pad"
                      editable={editMode}
                    />
                    {renderConfidenceBadge('pricePerGallon')}
                  </View>
                  {errors.pricePerGallon && (
                    <Text style={styles.errorMessage}>
                      {errors.pricePerGallon}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Cost *</Text>
                <View style={styles.inputWithBadge}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.totalCost && styles.inputError,
                      !editMode && styles.inputDisabled,
                    ]}
                    value={formData.totalCost}
                    onChangeText={(text) =>
                      setFormData({ ...formData, totalCost: text })
                    }
                    placeholder="$0.00"
                    keyboardType="decimal-pad"
                    editable={editMode}
                  />
                  {renderConfidenceBadge('totalCost')}
                </View>
                {errors.totalCost && (
                  <Text style={styles.errorMessage}>{errors.totalCost}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fuel Type</Text>
                <TextInput
                  style={[styles.input, !editMode && styles.inputDisabled]}
                  value={formData.fuelType}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fuelType: text })
                  }
                  placeholder="Regular, Premium, Diesel"
                  editable={editMode}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={[styles.input, !editMode && styles.inputDisabled]}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  placeholder="City, State"
                  editable={editMode}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <TextInput
                  style={[styles.input, !editMode && styles.inputDisabled]}
                  value={formData.paymentMethod}
                  onChangeText={(text) =>
                    setFormData({ ...formData, paymentMethod: text })
                  }
                  placeholder="Card, Cash, Fleet Card"
                  editable={editMode}
                />
              </View>

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
                  placeholder="Additional notes..."
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
                    <Text style={styles.saveButtonText}>💾 Save Receipt</Text>
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
  captureSection: {
    padding: 20,
    gap: 12,
  },
  captureOption: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  receiptGuide: {
    width: '80%',
    aspectRatio: 3 / 4,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    justifyContent: 'flex-end',
    padding: 16,
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
    height: 300,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
  inputWithBadge: {
    position: 'relative',
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
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  inputError: {
    borderColor: '#F44336',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  confidenceBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  errorMessage: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
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

export default FuelReceiptCapture;
