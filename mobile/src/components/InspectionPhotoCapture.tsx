/**
 * Fleet Mobile Inspection Photo Capture Component
 *
 * Checklist-based photo capture with pass/fail criteria, defect tagging,
 * and required vs optional photo tracking
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
  Image,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import CameraService from '../services/CameraService';
import {
  InspectionPhotoCaptureProps,
  InspectionChecklistItem,
  InspectionPhoto,
  InspectionReport,
  InspectionStatus,
  PassFailStatus,
  Defect,
  DamageSeverity,
  SyncStatus,
  QueueItemType,
  FlashMode,
} from '../types';

const { width } = Dimensions.get('window');

const PASS_FAIL_OPTIONS = [
  { value: PassFailStatus.PASS, label: 'Pass', color: '#34C759' },
  { value: PassFailStatus.FAIL, label: 'Fail', color: '#FF3B30' },
  { value: PassFailStatus.REQUIRES_ATTENTION, label: 'Needs Attention', color: '#FF9500' },
  { value: PassFailStatus.NA, label: 'N/A', color: '#8E8E93' },
];

const DEFECT_SEVERITY = [
  { value: DamageSeverity.MINOR, label: 'Minor', color: '#FFA500' },
  { value: DamageSeverity.MODERATE, label: 'Moderate', color: '#FF6B00' },
  { value: DamageSeverity.SEVERE, label: 'Severe', color: '#FF0000' },
  { value: DamageSeverity.CRITICAL, label: 'Critical', color: '#8B0000' },
];

export const InspectionPhotoCapture: React.FC<InspectionPhotoCaptureProps> = ({
  vehicleId,
  inspectionType,
  checklist,
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

  // Inspection state
  const [checklistItems, setChecklistItems] = useState<InspectionChecklistItem[]>(
    existingReport?.checklist || checklist
  );
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<InspectionChecklistItem>(
    checklistItems[0]
  );

  // Photo capture state
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<InspectionPhoto | null>(null);

  // Defect state
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [defectDescription, setDefectDescription] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<DamageSeverity>(
    DamageSeverity.MINOR
  );
  const [requiresImmediateAction, setRequiresImmediateAction] = useState(false);

  // UI state
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // Lifecycle & Permissions
  // ============================================================================

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    setCurrentItem(checklistItems[currentItemIndex]);
  }, [currentItemIndex, checklistItems]);

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
  // Checklist Navigation
  // ============================================================================

  const goToNextItem = () => {
    if (currentItemIndex < checklistItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const goToItem = (index: number) => {
    setCurrentItemIndex(index);
    setShowChecklist(false);
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

      const inspectionPhoto: InspectionPhoto = {
        ...photo,
        checklistItemId: currentItem.id,
        passFail: currentItem.passFail || undefined,
        annotations: [],
        defects: [],
      };

      setPreviewPhoto(inspectionPhoto);
      setShowPreview(true);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const acceptPhoto = () => {
    if (!previewPhoto) return;

    const updatedItems = [...checklistItems];
    const itemIndex = updatedItems.findIndex((item) => item.id === currentItem.id);

    if (itemIndex !== -1) {
      updatedItems[itemIndex].photos.push(previewPhoto);

      // Auto-set pass/fail if not set
      if (!updatedItems[itemIndex].passFail) {
        updatedItems[itemIndex].passFail = PassFailStatus.PASS;
      }

      setChecklistItems(updatedItems);
    }

    setShowPreview(false);
    setPreviewPhoto(null);

    // Auto-advance if we have enough photos
    const maxPhotos = currentItem.maxPhotos || 999;
    if (currentItem.photos.length + 1 >= maxPhotos) {
      setTimeout(() => goToNextItem(), 500);
    }
  };

  const retakePhoto = () => {
    if (previewPhoto) {
      CameraService.deletePhoto(previewPhoto.uri);
    }
    setShowPreview(false);
    setPreviewPhoto(null);
  };

  const deletePhoto = (itemId: string, photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedItems = checklistItems.map((item) => {
            if (item.id === itemId) {
              const photo = item.photos.find((p) => p.id === photoId);
              if (photo) {
                CameraService.deletePhoto(photo.uri);
              }
              return {
                ...item,
                photos: item.photos.filter((p) => p.id !== photoId),
              };
            }
            return item;
          });
          setChecklistItems(updatedItems);
        },
      },
    ]);
  };

  // ============================================================================
  // Pass/Fail Management
  // ============================================================================

  const updatePassFail = (itemId: string, status: PassFailStatus) => {
    const updatedItems = checklistItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, passFail: status };
      }
      return item;
    });
    setChecklistItems(updatedItems);

    // If marked as fail or requires attention, prompt for defect
    if (
      status === PassFailStatus.FAIL ||
      status === PassFailStatus.REQUIRES_ATTENTION
    ) {
      setShowDefectModal(true);
    }
  };

  // ============================================================================
  // Defect Management
  // ============================================================================

  const addDefect = () => {
    if (!defectDescription.trim()) {
      Alert.alert('Error', 'Please provide a defect description');
      return;
    }

    const defect: Defect = {
      id: `defect_${Date.now()}`,
      severity: defectSeverity,
      description: defectDescription,
      requiresImmediateAction,
    };

    const updatedItems = checklistItems.map((item) => {
      if (item.id === currentItem.id) {
        return {
          ...item,
          defects: [...item.defects, defect],
        };
      }
      return item;
    });

    setChecklistItems(updatedItems);
    setShowDefectModal(false);
    setDefectDescription('');
    setDefectSeverity(DamageSeverity.MINOR);
    setRequiresImmediateAction(false);
  };

  const removeDefect = (itemId: string, defectId: string) => {
    const updatedItems = checklistItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          defects: item.defects.filter((d) => d.id !== defectId),
        };
      }
      return item;
    });
    setChecklistItems(updatedItems);
  };

  // ============================================================================
  // Inspection Submission
  // ============================================================================

  const calculateOverallResult = (): PassFailStatus => {
    const hasFailures = checklistItems.some(
      (item) => item.passFail === PassFailStatus.FAIL
    );
    const hasAttention = checklistItems.some(
      (item) => item.passFail === PassFailStatus.REQUIRES_ATTENTION
    );

    if (hasFailures) return PassFailStatus.FAIL;
    if (hasAttention) return PassFailStatus.REQUIRES_ATTENTION;
    return PassFailStatus.PASS;
  };

  const validateInspection = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    checklistItems.forEach((item) => {
      // Check required items
      if (item.required && !item.passFail) {
        errors.push(`${item.item}: Pass/Fail status required`);
      }

      // Check required photos
      if (item.requiresPhoto) {
        const minPhotos = item.minPhotos || 1;
        if (item.photos.length < minPhotos) {
          errors.push(`${item.item}: At least ${minPhotos} photo(s) required`);
        }
      }

      // Check defects for failed items
      if (
        (item.passFail === PassFailStatus.FAIL ||
          item.passFail === PassFailStatus.REQUIRES_ATTENTION) &&
        item.defects.length === 0
      ) {
        errors.push(`${item.item}: Defect description required for failed items`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const submitInspection = async () => {
    const validation = validateInspection();

    if (!validation.valid) {
      Alert.alert(
        'Incomplete Inspection',
        `Please complete the following:\n\n${validation.errors.join('\n')}`,
        [
          { text: 'Review', style: 'default' },
          {
            text: 'Submit Anyway',
            style: 'destructive',
            onPress: () => performSubmit(),
          },
        ]
      );
      return;
    }

    performSubmit();
  };

  const performSubmit = async () => {
    setLoading(true);
    try {
      const report: InspectionReport = {
        id: existingReport?.id || `inspection_${Date.now()}`,
        vehicleId,
        inspectorId: 'current_user', // TODO: Get from auth context
        type: inspectionType,
        startedAt: existingReport?.startedAt || new Date(),
        completedAt: new Date(),
        status: InspectionStatus.COMPLETED,
        checklist: checklistItems,
        overallResult: calculateOverallResult(),
        syncStatus: SyncStatus.PENDING,
      };

      // Add to offline queue for syncing
      await CameraService.addToQueue(QueueItemType.INSPECTION_REPORT, report, 10);

      // Trigger queue processing
      await CameraService.processQueue();

      const resultText =
        report.overallResult === PassFailStatus.PASS
          ? 'passed'
          : report.overallResult === PassFailStatus.FAIL
          ? 'failed'
          : 'completed with issues';

      Alert.alert(
        'Inspection Complete',
        `The inspection has ${resultText}.`,
        [{ text: 'OK', onPress: () => onComplete(report) }]
      );
    } catch (error) {
      console.error('Error submitting inspection:', error);
      Alert.alert(
        'Error',
        'Failed to submit inspection. It has been saved for offline sync.'
      );
    } finally {
      setLoading(false);
    }
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
            onPress={() => setShowChecklist(true)}
          >
            <Text style={styles.controlButtonText}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() =>
              setFlash(
                flash === FlashMode.OFF
                  ? FlashMode.ON
                  : flash === FlashMode.ON
                  ? FlashMode.AUTO
                  : FlashMode.OFF
              )
            }
          >
            <Text style={styles.controlButtonText}>
              {flash === FlashMode.OFF ? '⚡' : flash === FlashMode.ON ? '⚡' : 'A'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentItemIndex + 1} / {checklistItems.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentItemIndex + 1) / checklistItems.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Current Item Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemCategory}>{currentItem.category}</Text>
          <Text style={styles.itemName}>{currentItem.item}</Text>
          {currentItem.description && (
            <Text style={styles.itemDescription}>{currentItem.description}</Text>
          )}
          {currentItem.requiresPhoto && (
            <Text style={styles.photoRequirement}>
              {currentItem.required ? 'Photo Required' : 'Photo Optional'} (
              {currentItem.photos.length}/{currentItem.minPhotos || 1}+)
            </Text>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.navButton, currentItemIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPreviousItem}
            disabled={currentItemIndex === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.capturingButton]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner}>
                <Text style={styles.photoCount}>{currentItem.photos.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={goToNextItem}>
            <Text style={styles.navButtonText}>
              {currentItemIndex === checklistItems.length - 1 ? 'Review' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pass/Fail Selector */}
      <View style={styles.passFailContainer}>
        <Text style={styles.passFailLabel}>Status:</Text>
        <View style={styles.passFailButtons}>
          {PASS_FAIL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.passFailButton,
                currentItem.passFail === option.value && {
                  backgroundColor: option.color,
                  borderColor: option.color,
                },
              ]}
              onPress={() => updatePassFail(currentItem.id, option.value)}
            >
              <Text
                style={[
                  styles.passFailButtonText,
                  currentItem.passFail === option.value &&
                    styles.passFailButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
                <Text
                  style={[styles.previewButtonText, styles.previewButtonTextPrimary]}
                >
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Checklist Modal */}
      {showChecklist && (
        <Modal visible={showChecklist} animationType="slide">
          <View style={styles.checklistContainer}>
            <View style={styles.checklistHeader}>
              <Text style={styles.checklistTitle}>Inspection Checklist</Text>
              <TouchableOpacity onPress={() => setShowChecklist(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={checklistItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.checklistItem,
                    index === currentItemIndex && styles.checklistItemActive,
                  ]}
                  onPress={() => goToItem(index)}
                >
                  <View style={styles.checklistItemInfo}>
                    <Text style={styles.checklistItemCategory}>{item.category}</Text>
                    <Text style={styles.checklistItemName}>{item.item}</Text>
                    <Text style={styles.checklistItemMeta}>
                      {item.photos.length} photo{item.photos.length !== 1 ? 's' : ''} •{' '}
                      {item.defects.length} defect{item.defects.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.checklistItemStatus}>
                    {item.passFail && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              PASS_FAIL_OPTIONS.find((o) => o.value === item.passFail)
                                ?.color || '#8E8E93',
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {
                            PASS_FAIL_OPTIONS.find((o) => o.value === item.passFail)
                              ?.label
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      )}

      {/* Defect Modal */}
      {showDefectModal && (
        <Modal visible={showDefectModal} animationType="slide">
          <View style={styles.defectContainer}>
            <View style={styles.defectHeader}>
              <Text style={styles.defectTitle}>Add Defect</Text>
              <TouchableOpacity onPress={() => setShowDefectModal(false)}>
                <Text style={styles.closeButton}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.defectForm}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.defectInput}
                multiline
                numberOfLines={4}
                placeholder="Describe the defect..."
                value={defectDescription}
                onChangeText={setDefectDescription}
              />

              <Text style={styles.formLabel}>Severity</Text>
              <View style={styles.severityButtons}>
                {DEFECT_SEVERITY.map((severity) => (
                  <TouchableOpacity
                    key={severity.value}
                    style={[
                      styles.severityButton,
                      defectSeverity === severity.value && {
                        backgroundColor: severity.color,
                        borderColor: severity.color,
                      },
                    ]}
                    onPress={() => setDefectSeverity(severity.value)}
                  >
                    <Text
                      style={[
                        styles.severityButtonText,
                        defectSeverity === severity.value &&
                          styles.severityButtonTextSelected,
                      ]}
                    >
                      {severity.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRequiresImmediateAction(!requiresImmediateAction)}
              >
                <View
                  style={[
                    styles.checkbox,
                    requiresImmediateAction && styles.checkboxChecked,
                  ]}
                >
                  {requiresImmediateAction && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Requires Immediate Action</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.defectActions}>
              <TouchableOpacity
                style={[styles.defectButton, styles.defectButtonPrimary]}
                onPress={addDefect}
              >
                <Text style={styles.defectButtonTextPrimary}>Add Defect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  // ============================================================================
  // Summary View
  // ============================================================================

  function renderSummary() {
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter((item) => item.passFail).length;
    const passedItems = checklistItems.filter(
      (item) => item.passFail === PassFailStatus.PASS
    ).length;
    const failedItems = checklistItems.filter(
      (item) => item.passFail === PassFailStatus.FAIL
    ).length;
    const totalPhotos = checklistItems.reduce(
      (sum, item) => sum + item.photos.length,
      0
    );
    const totalDefects = checklistItems.reduce(
      (sum, item) => sum + item.defects.length,
      0
    );

    return (
      <View style={styles.container}>
        <ScrollView style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <TouchableOpacity onPress={() => setShowSummary(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.summaryTitle}>Inspection Summary</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedItems}/{totalItems}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>{passedItems}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>{failedItems}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalPhotos}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalDefects}</Text>
              <Text style={styles.statLabel}>Defects</Text>
            </View>
          </View>

          {/* Checklist Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspection Items</Text>
            {checklistItems.map((item, index) => (
              <View key={item.id} style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <Text style={styles.summaryItemName}>
                    {index + 1}. {item.item}
                  </Text>
                  {item.passFail && (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            PASS_FAIL_OPTIONS.find((o) => o.value === item.passFail)
                              ?.color || '#8E8E93',
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {PASS_FAIL_OPTIONS.find((o) => o.value === item.passFail)?.label}
                      </Text>
                    </View>
                  )}
                </View>

                {item.photos.length > 0 && (
                  <View style={styles.photoRow}>
                    {item.photos.map((photo) => (
                      <Image
                        key={photo.id}
                        source={{ uri: photo.uri }}
                        style={styles.summaryPhoto}
                      />
                    ))}
                  </View>
                )}

                {item.defects.length > 0 && (
                  <View style={styles.defectsSection}>
                    {item.defects.map((defect) => (
                      <View key={defect.id} style={styles.defectItem}>
                        <Text style={styles.defectSeverity}>
                          {
                            DEFECT_SEVERITY.find((s) => s.value === defect.severity)
                              ?.label
                          }
                        </Text>
                        <Text style={styles.defectDescription}>
                          {defect.description}
                        </Text>
                        {defect.requiresImmediateAction && (
                          <Text style={styles.urgentLabel}>⚠️ Immediate Action Required</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {item.notes && (
                  <Text style={styles.itemNotes}>Note: {item.notes}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitInspection}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Inspection</Text>
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
  progressContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  itemInfo: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  itemCategory: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  photoRequirement: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passFailContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 15,
  },
  passFailLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  passFailButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passFailButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  passFailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  passFailButtonTextSelected: {
    color: '#fff',
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
  checklistContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checklistTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checklistItemActive: {
    backgroundColor: '#f0f8ff',
  },
  checklistItemInfo: {
    flex: 1,
  },
  checklistItemCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  checklistItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 4,
  },
  checklistItemMeta: {
    fontSize: 12,
    color: '#999',
  },
  checklistItemStatus: {
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  defectContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  defectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  defectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  defectForm: {
    flex: 1,
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  defectInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  severityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  defectActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  defectButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  defectButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  defectButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  summaryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  summaryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  defectsSection: {
    marginTop: 10,
  },
  defectItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  defectSeverity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 5,
  },
  defectDescription: {
    fontSize: 14,
    color: '#333',
  },
  urgentLabel: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 5,
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
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

export default InspectionPhotoCapture;
