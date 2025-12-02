/**
 * Fleet Mobile Damage Report Camera Component
 *
 * Multi-angle photo capture with GPS tagging, voice-to-text descriptions,
 * damage location markers, severity selection, and offline queue support
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Voice from '@react-native-voice/voice';
import CameraService from '../services/CameraService';
import {
  DamageReportCameraProps,
  DamageAngle,
  DamageSeverity,
  DamagePhoto,
  DamageReport,
  DamageLocation,
  DamageReportStatus,
  SyncStatus,
  QueueItemType,
  FlashMode,
} from '../types';

const { width, height } = Dimensions.get('window');

const DAMAGE_ANGLES: { value: DamageAngle; label: string; icon: string }[] = [
  { value: DamageAngle.FRONT, label: 'Front', icon: '🚗' },
  { value: DamageAngle.REAR, label: 'Rear', icon: '🚙' },
  { value: DamageAngle.LEFT_SIDE, label: 'Left Side', icon: '⬅️' },
  { value: DamageAngle.RIGHT_SIDE, label: 'Right Side', icon: '➡️' },
  { value: DamageAngle.INTERIOR, label: 'Interior', icon: '🪑' },
  { value: DamageAngle.DAMAGE_CLOSEUP, label: 'Close-up', icon: '🔍' },
  { value: DamageAngle.ODOMETER, label: 'Odometer', icon: '📊' },
  { value: DamageAngle.VIN, label: 'VIN', icon: '🔢' },
  { value: DamageAngle.LICENSE_PLATE, label: 'License', icon: '🔖' },
  { value: DamageAngle.OTHER, label: 'Other', icon: '📷' },
];

const SEVERITY_LEVELS: { value: DamageSeverity; label: string; color: string }[] = [
  { value: DamageSeverity.MINOR, label: 'Minor', color: '#FFA500' },
  { value: DamageSeverity.MODERATE, label: 'Moderate', color: '#FF6B00' },
  { value: DamageSeverity.SEVERE, label: 'Severe', color: '#FF0000' },
  { value: DamageSeverity.CRITICAL, label: 'Critical', color: '#8B0000' },
];

export const DamageReportCamera: React.FC<DamageReportCameraProps> = ({
  vehicleId,
  onComplete,
  onCancel,
  existingReport,
}) => {
  // Camera state
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [flash, setFlash] = useState<FlashMode>(FlashMode.AUTO);
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');

  // Photo capture state
  const [capturedPhotos, setCapturedPhotos] = useState<DamagePhoto[]>(
    existingReport?.photos || []
  );
  const [currentAngle, setCurrentAngle] = useState<DamageAngle>(DamageAngle.FRONT);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<DamagePhoto | null>(null);

  // Damage report state
  const [severity, setSeverity] = useState<DamageSeverity>(
    existingReport?.severity || DamageSeverity.MODERATE
  );
  const [description, setDescription] = useState(existingReport?.description || '');
  const [damageLocations, setDamageLocations] = useState<DamageLocation[]>(
    existingReport?.damageLocations || []
  );

  // Voice recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState(
    existingReport?.voiceTranscription || ''
  );

  // UI state
  const [showVehicleDiagram, setShowVehicleDiagram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // ============================================================================
  // Lifecycle & Permissions
  // ============================================================================

  useEffect(() => {
    requestPermissions();
    setupVoiceRecognition();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const permissions = await CameraService.ensurePermissions(true);
      setHasPermission(permissions.camera);
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Permission Required', 'Camera permission is required to continue.');
    }
  };

  // ============================================================================
  // Voice Recognition
  // ============================================================================

  const setupVoiceRecognition = () => {
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const transcription = e.value[0];
        setVoiceTranscription(transcription);
        setDescription((prev) => (prev ? `${prev} ${transcription}` : transcription));
      }
    };
    Voice.onSpeechError = (e) => {
      console.error('Voice recognition error:', e);
      setIsRecording(false);
    };
  };

  const startVoiceRecording = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recording:', error);
    }
  };

  // ============================================================================
  // Photo Capture
  // ============================================================================

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await CameraService.capturePhoto(cameraRef, {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
        includeGPS: true,
        flashMode: flash,
      });

      const damagePhoto: DamagePhoto = {
        ...photo,
        angle: currentAngle,
        severity,
        damageLocations: [],
        notes: '',
      };

      setCapturedPhotos((prev) => [...prev, damagePhoto]);
      setPreviewPhoto(damagePhoto);
      setShowPreview(true);

      // Move to next angle if available
      const currentIndex = DAMAGE_ANGLES.findIndex((a) => a.value === currentAngle);
      if (currentIndex < DAMAGE_ANGLES.length - 1) {
        setCurrentAngle(DAMAGE_ANGLES[currentIndex + 1].value);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    if (previewPhoto) {
      setCapturedPhotos((prev) => prev.filter((p) => p.id !== previewPhoto.id));
      CameraService.deletePhoto(previewPhoto.uri);
    }
    setShowPreview(false);
    setPreviewPhoto(null);
  };

  const acceptPhoto = () => {
    setShowPreview(false);
    setPreviewPhoto(null);
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const photo = capturedPhotos.find((p) => p.id === photoId);
          if (photo) {
            CameraService.deletePhoto(photo.uri);
          }
          setCapturedPhotos((prev) => prev.filter((p) => p.id !== photoId));
        },
      },
    ]);
  };

  // ============================================================================
  // Damage Location Marking
  // ============================================================================

  const handleVehicleDiagramPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const diagramWidth = width - 40;
    const diagramHeight = 300;

    const newLocation: DamageLocation = {
      x: (locationX / diagramWidth) * 100,
      y: (locationY / diagramHeight) * 100,
      label: `Damage ${damageLocations.length + 1}`,
    };

    setDamageLocations((prev) => [...prev, newLocation]);
  };

  const removeDamageLocation = (index: number) => {
    setDamageLocations((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================================
  // Report Submission
  // ============================================================================

  const submitReport = async () => {
    if (capturedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please capture at least one photo before submitting.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please add a description of the damage.');
      return;
    }

    setLoading(true);
    try {
      const report: DamageReport = {
        id: existingReport?.id || `damage_${Date.now()}`,
        vehicleId,
        reportedBy: 'current_user', // TODO: Get from auth context
        reportedAt: new Date(),
        photos: capturedPhotos,
        severity,
        description,
        voiceTranscription,
        damageLocations,
        status: DamageReportStatus.SUBMITTED,
        syncStatus: SyncStatus.PENDING,
      };

      // Add to offline queue for syncing
      await CameraService.addToQueue(QueueItemType.DAMAGE_REPORT, report, 10);

      // Trigger queue processing
      await CameraService.processQueue();

      Alert.alert('Success', 'Damage report submitted successfully!', [
        { text: 'OK', onPress: () => onComplete(report) },
      ]);
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. It has been saved for offline sync.');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    const report: DamageReport = {
      id: existingReport?.id || `damage_draft_${Date.now()}`,
      vehicleId,
      reportedBy: 'current_user',
      reportedAt: new Date(),
      photos: capturedPhotos,
      severity,
      description,
      voiceTranscription,
      damageLocations,
      status: DamageReportStatus.DRAFT,
      syncStatus: SyncStatus.PENDING,
    };

    await CameraService.addToQueue(QueueItemType.DAMAGE_REPORT, report, 5);
    Alert.alert('Draft Saved', 'Your damage report has been saved as a draft.');
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  if (!hasPermission || !device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
      </View>
    );
  }

  if (showSummary) {
    return renderSummary();
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive && !showPreview}
          photo={true}
        />

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
            <Text style={styles.controlButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlash(
              flash === FlashMode.OFF
                ? FlashMode.ON
                : flash === FlashMode.ON
                ? FlashMode.AUTO
                : FlashMode.OFF
            )}
          >
            <Text style={styles.controlButtonText}>
              {flash === FlashMode.OFF ? '⚡' : flash === FlashMode.ON ? '⚡' : 'A'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Angle Indicator */}
        <View style={styles.angleIndicator}>
          <Text style={styles.angleText}>
            {DAMAGE_ANGLES.find((a) => a.value === currentAngle)?.icon}{' '}
            {DAMAGE_ANGLES.find((a) => a.value === currentAngle)?.label}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.thumbnailButton}
            onPress={() => setShowSummary(true)}
          >
            <Text style={styles.thumbnailCount}>{capturedPhotos.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.capturingButton]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.voiceButton}
            onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
          >
            <Text style={[styles.voiceButtonText, isRecording && styles.recording]}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Angle Selector */}
      <View style={styles.angleSelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.angleSelectorContent}
        >
          {DAMAGE_ANGLES.map((angle) => {
            const isSelected = currentAngle === angle.value;
            const hasCaptured = capturedPhotos.some((p) => p.angle === angle.value);
            return (
              <TouchableOpacity
                key={angle.value}
                style={[
                  styles.angleButton,
                  isSelected && styles.angleButtonSelected,
                  hasCaptured && styles.angleButtonCaptured,
                ]}
                onPress={() => setCurrentAngle(angle.value)}
              >
                <Text style={styles.angleIcon}>{angle.icon}</Text>
                <Text style={styles.angleLabel}>{angle.label}</Text>
                {hasCaptured && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Preview Modal */}
      {showPreview && previewPhoto && (
        <Modal visible={showPreview} animationType="slide">
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} />

            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.previewButton} onPress={retakePhoto}>
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, styles.previewButtonPrimary]}
                onPress={acceptPhoto}
              >
                <Text style={[styles.previewButtonText, styles.previewButtonTextPrimary]}>
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Vehicle Diagram Modal */}
      {showVehicleDiagram && (
        <Modal visible={showVehicleDiagram} animationType="slide">
          <View style={styles.diagramContainer}>
            <View style={styles.diagramHeader}>
              <Text style={styles.diagramTitle}>Mark Damage Locations</Text>
              <TouchableOpacity onPress={() => setShowVehicleDiagram(false)}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.vehicleDiagram}
              onPress={handleVehicleDiagramPress}
              activeOpacity={0.9}
            >
              {/* Simple vehicle diagram */}
              <View style={styles.vehicleShape}>
                {damageLocations.map((location, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.damageMarker,
                      {
                        left: `${location.x}%`,
                        top: `${location.y}%`,
                      },
                    ]}
                    onPress={() => removeDamageLocation(index)}
                  >
                    <Text style={styles.damageMarkerText}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>

            <Text style={styles.diagramInstruction}>
              Tap on the diagram to mark damage locations
            </Text>
          </View>
        </Modal>
      )}
    </View>
  );

  // ============================================================================
  // Summary View
  // ============================================================================

  function renderSummary() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.summaryContainer}>
          {/* Header */}
          <View style={styles.summaryHeader}>
            <TouchableOpacity onPress={() => setShowSummary(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.summaryTitle}>Damage Report</Text>
            <TouchableOpacity onPress={saveDraft}>
              <Text style={styles.saveButton}>Save Draft</Text>
            </TouchableOpacity>
          </View>

          {/* Photos Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({capturedPhotos.length})</Text>
            <View style={styles.photoGrid}>
              {capturedPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  <Text style={styles.photoAngle}>
                    {DAMAGE_ANGLES.find((a) => a.value === photo.angle)?.label}
                  </Text>
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => deletePhoto(photo.id)}
                  >
                    <Text style={styles.deletePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Severity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity</Text>
            <View style={styles.severityButtons}>
              {SEVERITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.severityButton,
                    severity === level.value && {
                      backgroundColor: level.color,
                      borderColor: level.color,
                    },
                  ]}
                  onPress={() => setSeverity(level.value)}
                >
                  <Text
                    style={[
                      styles.severityButtonText,
                      severity === level.value && styles.severityButtonTextSelected,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              multiline
              numberOfLines={4}
              placeholder="Describe the damage..."
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Voice Transcription */}
          {voiceTranscription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice Note</Text>
              <Text style={styles.transcriptionText}>{voiceTranscription}</Text>
            </View>
          )}

          {/* Damage Locations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Damage Locations</Text>
              <TouchableOpacity onPress={() => setShowVehicleDiagram(true)}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {damageLocations.length > 0 ? (
              damageLocations.map((location, index) => (
                <View key={index} style={styles.locationItem}>
                  <Text>{location.label || `Location ${index + 1}`}</Text>
                  <TouchableOpacity onPress={() => removeDamageLocation(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No damage locations marked</Text>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitReport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  cameraContainer: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  angleIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  angleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  thumbnailButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  thumbnailCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  capturingButton: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  voiceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  voiceButtonText: {
    fontSize: 24,
  },
  recording: {
    color: '#FF0000',
  },
  angleSelector: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 10,
  },
  angleSelectorContent: {
    paddingHorizontal: 10,
  },
  angleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    minWidth: 80,
  },
  angleButtonSelected: {
    backgroundColor: '#007AFF',
  },
  angleButtonCaptured: {
    backgroundColor: '#34C759',
  },
  angleIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  angleLabel: {
    color: '#fff',
    fontSize: 12,
  },
  checkmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000',
  },
  previewButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  previewButtonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewButtonTextPrimary: {
    color: '#fff',
  },
  diagramContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  diagramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  diagramTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleDiagram: {
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  vehicleShape: {
    flex: 1,
    margin: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    position: 'relative',
  },
  damageMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  damageMarkerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  diagramInstruction: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  photoItem: {
    width: (width - 60) / 3,
    margin: 5,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  photoAngle: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  severityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  severityButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
  severityButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  severityButtonTextSelected: {
    color: '#fff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  transcriptionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  removeButton: {
    color: '#FF3B30',
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  submitContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DamageReportCamera;
