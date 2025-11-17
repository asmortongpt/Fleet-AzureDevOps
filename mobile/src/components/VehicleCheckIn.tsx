/**
 * VehicleCheckIn Component
 *
 * Multi-method vehicle check-in with:
 * - NFC tap to check in
 * - QR code scan alternative
 * - Manual VIN entry fallback
 * - Automatic reservation start
 * - Pre-trip inspection trigger
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import NFCReader from '../services/NFCReader'
import BarcodeScanner from './BarcodeScanner'

export type CheckInMethod = 'nfc' | 'qr' | 'manual'

export interface VehicleCheckInProps {
  onCheckInSuccess: (data: CheckInResult) => void
  onClose: () => void
  enableNFC?: boolean
  enableQR?: boolean
  enableManual?: boolean
  autoStartInspection?: boolean
  authToken: string
}

export interface CheckInResult {
  success: boolean
  vehicleId?: string
  vin?: string
  reservationId?: string
  vehicle?: VehicleInfo
  method: CheckInMethod
  requiresInspection?: boolean
  message?: string
}

export interface VehicleInfo {
  id: string
  vin: string
  make: string
  model: string
  year: number
  licensePlate?: string
  fleetNumber?: string
  mileage?: number
  fuelLevel?: number
  status: string
  location?: string
  imageUrl?: string
}

export const VehicleCheckIn: React.FC<VehicleCheckInProps> = ({
  onCheckInSuccess,
  onClose,
  enableNFC = true,
  enableQR = true,
  enableManual = true,
  autoStartInspection = true,
  authToken
}) => {
  const [selectedMethod, setSelectedMethod] = useState<CheckInMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [manualVIN, setManualVIN] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    checkNFCAvailability()

    return () => {
      NFCReader.stopReading()
    }
  }, [])

  const checkNFCAvailability = async () => {
    if (!enableNFC) return

    const supported = await NFCReader.init()
    setNfcSupported(supported)

    if (supported) {
      const enabled = await NFCReader.isEnabled()
      setNfcEnabled(enabled)
    }
  }

  const handleNFCCheckIn = async () => {
    if (!nfcEnabled) {
      Alert.alert(
        'NFC Disabled',
        'Please enable NFC in your device settings',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => NFCReader.goToNfcSetting()
          }
        ]
      )
      return
    }

    setSelectedMethod('nfc')
    setLoading(true)

    try {
      Alert.alert(
        'Ready to Scan',
        'Hold your device near the vehicle NFC tag',
        [{ text: 'OK' }]
      )

      const result = await NFCReader.vehicleCheckIn(authToken)

      if (result.success) {
        // Fetch vehicle details
        await fetchVehicleDetails(result.reservationId!)
      } else {
        setLoading(false)
        Alert.alert('Check-In Failed', result.message || 'Unable to check in')
      }
    } catch (error) {
      setLoading(false)
      console.error('NFC check-in error:', error)
      Alert.alert('Error', 'Failed to read NFC tag')
    }
  }

  const handleQRCheckIn = () => {
    setSelectedMethod('qr')
    setShowScanner(true)
  }

  const handleQRScan = async (scannedItem: any) => {
    setShowScanner(false)
    setLoading(true)

    try {
      // Parse QR code data
      const qrData = JSON.parse(scannedItem.barcode)

      if (qrData.vehicleId || qrData.vin) {
        await performCheckIn('qr', qrData.vehicleId, qrData.vin)
      } else {
        setLoading(false)
        Alert.alert('Invalid QR Code', 'This QR code is not a valid vehicle code')
      }
    } catch (error) {
      // Try as plain VIN
      await performCheckIn('qr', undefined, scannedItem.barcode)
    }
  }

  const handleManualCheckIn = async () => {
    if (!manualVIN.trim()) {
      Alert.alert('VIN Required', 'Please enter a valid VIN')
      return
    }

    setSelectedMethod('manual')
    setLoading(true)

    await performCheckIn('manual', undefined, manualVIN.trim().toUpperCase())
  }

  const performCheckIn = async (
    method: CheckInMethod,
    vehicleId?: string,
    vin?: string
  ) => {
    try {
      const response = await fetch('/api/mobile/checkin/nfc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          vehicleId,
          vin,
          checkInMethod: method,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        await fetchVehicleDetails(result.reservationId, result.vehicleId, vin)
      } else {
        const error = await response.json()
        setLoading(false)
        Alert.alert('Check-In Failed', error.message || 'Unable to check in')
      }
    } catch (error) {
      setLoading(false)
      console.error('Check-in error:', error)
      Alert.alert('Error', 'Network error during check-in')
    }
  }

  const fetchVehicleDetails = async (
    reservationId: string,
    vehicleId?: string,
    vin?: string
  ) => {
    try {
      const params = new URLSearchParams()
      if (vehicleId) params.append('vehicleId', vehicleId)
      if (vin) params.append('vin', vin)

      const response = await fetch(
        `/api/mobile/vehicles/details?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      )

      if (response.ok) {
        const vehicle = await response.json()
        setVehicleInfo(vehicle)
        setShowConfirmation(true)
        setLoading(false)
      } else {
        // Check-in succeeded but couldn't fetch details
        setLoading(false)
        completeCheckIn(reservationId, vehicleId, vin)
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error)
      setLoading(false)
      completeCheckIn(reservationId, vehicleId, vin)
    }
  }

  const completeCheckIn = (
    reservationId?: string,
    vehicleId?: string,
    vin?: string
  ) => {
    const result: CheckInResult = {
      success: true,
      vehicleId,
      vin,
      reservationId,
      vehicle: vehicleInfo || undefined,
      method: selectedMethod!,
      requiresInspection: autoStartInspection,
      message: 'Check-in successful'
    }

    onCheckInSuccess(result)
  }

  const handleConfirmCheckIn = () => {
    setShowConfirmation(false)
    completeCheckIn(
      undefined,
      vehicleInfo?.id,
      vehicleInfo?.vin
    )
  }

  const renderMethodButton = (
    method: CheckInMethod,
    icon: string,
    label: string,
    subtitle: string,
    onPress: () => void,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[styles.methodButton, disabled && styles.methodButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.methodIconContainer}>
        <Icon
          name={icon}
          size={40}
          color={disabled ? '#999' : '#2196F3'}
        />
      </View>
      <View style={styles.methodTextContainer}>
        <Text style={[styles.methodLabel, disabled && styles.methodLabelDisabled]}>
          {label}
        </Text>
        <Text style={styles.methodSubtitle}>{subtitle}</Text>
      </View>
      {!disabled && (
        <Icon name="chevron-right" size={24} color="#999" />
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Checking in...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Vehicle Check-In</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Icon name="information" size={24} color="#2196F3" />
          <Text style={styles.instructionsText}>
            Choose a method to check in to your vehicle
          </Text>
        </View>

        {/* Check-in methods */}
        <View style={styles.methodsContainer}>
          {enableNFC && (
            <>
              {renderMethodButton(
                'nfc',
                'nfc-variant',
                'NFC Tap',
                'Tap your device to vehicle tag',
                handleNFCCheckIn,
                !nfcSupported || !nfcEnabled
              )}
              {!nfcEnabled && nfcSupported && (
                <Text style={styles.warningText}>
                  NFC is disabled. Enable it in settings.
                </Text>
              )}
            </>
          )}

          {enableQR &&
            renderMethodButton(
              'qr',
              'qrcode-scan',
              'QR Code',
              'Scan vehicle QR code',
              handleQRCheckIn
            )}

          {enableManual && (
            <View style={styles.manualContainer}>
              {renderMethodButton(
                'manual',
                'form-textbox',
                'Manual Entry',
                'Enter VIN manually',
                () => {},
                false
              )}
              <View style={styles.manualInputContainer}>
                <TextInput
                  style={styles.vinInput}
                  value={manualVIN}
                  onChangeText={setManualVIN}
                  placeholder="Enter VIN (17 characters)"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  maxLength={17}
                />
                <TouchableOpacity
                  style={[
                    styles.manualSubmitButton,
                    manualVIN.length !== 17 && styles.manualSubmitButtonDisabled
                  ]}
                  onPress={handleManualCheckIn}
                  disabled={manualVIN.length !== 17}
                >
                  <Text style={styles.manualSubmitButtonText}>Check In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Help text */}
        <View style={styles.helpContainer}>
          <Icon name="help-circle" size={20} color="#666" />
          <Text style={styles.helpText}>
            Need help? Contact fleet management for assistance.
          </Text>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      {showScanner && (
        <Modal visible={showScanner} animationType="slide">
          <BarcodeScanner
            mode="single"
            scanType="general"
            onScan={handleQRScan}
            onClose={() => setShowScanner(false)}
            enablePartLookup={false}
            enableAssetLookup={false}
            autoSubmit={true}
            barcodeFormats={['qr']}
          />
        </Modal>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Icon name="check-circle" size={60} color="#4CAF50" />
            <Text style={styles.confirmationTitle}>Vehicle Found</Text>

            {vehicleInfo && (
              <View style={styles.vehicleDetailsContainer}>
                <View style={styles.vehicleDetailRow}>
                  <Text style={styles.vehicleDetailLabel}>Vehicle:</Text>
                  <Text style={styles.vehicleDetailValue}>
                    {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                  </Text>
                </View>
                <View style={styles.vehicleDetailRow}>
                  <Text style={styles.vehicleDetailLabel}>VIN:</Text>
                  <Text style={styles.vehicleDetailValue}>{vehicleInfo.vin}</Text>
                </View>
                {vehicleInfo.licensePlate && (
                  <View style={styles.vehicleDetailRow}>
                    <Text style={styles.vehicleDetailLabel}>License Plate:</Text>
                    <Text style={styles.vehicleDetailValue}>
                      {vehicleInfo.licensePlate}
                    </Text>
                  </View>
                )}
                {vehicleInfo.fleetNumber && (
                  <View style={styles.vehicleDetailRow}>
                    <Text style={styles.vehicleDetailLabel}>Fleet #:</Text>
                    <Text style={styles.vehicleDetailValue}>
                      {vehicleInfo.fleetNumber}
                    </Text>
                  </View>
                )}
                {vehicleInfo.mileage !== undefined && (
                  <View style={styles.vehicleDetailRow}>
                    <Text style={styles.vehicleDetailLabel}>Mileage:</Text>
                    <Text style={styles.vehicleDetailValue}>
                      {vehicleInfo.mileage.toLocaleString()} mi
                    </Text>
                  </View>
                )}
              </View>
            )}

            {autoStartInspection && (
              <Text style={styles.inspectionNotice}>
                Pre-trip inspection will start after check-in
              </Text>
            )}

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowConfirmation(false)
                  setLoading(false)
                  setVehicleInfo(null)
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmCheckIn}
              >
                <Text style={styles.confirmButtonText}>Confirm Check-In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  closeButton: {
    padding: 5
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 20
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976D2'
  },
  methodsContainer: {
    gap: 15
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  methodButtonDisabled: {
    opacity: 0.5
  },
  methodIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  methodTextContainer: {
    flex: 1,
    marginLeft: 15
  },
  methodLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  methodLabelDisabled: {
    color: '#999'
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#666'
  },
  warningText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 20
  },
  manualContainer: {
    gap: 10
  },
  manualInputContainer: {
    gap: 10,
    paddingHorizontal: 20
  },
  vinInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333'
  },
  manualSubmitButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  manualSubmitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  manualSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  helpText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#666'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%'
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 20
  },
  vehicleDetailsContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  vehicleDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  vehicleDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  inspectionNotice: {
    fontSize: 13,
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
})

export default VehicleCheckIn
