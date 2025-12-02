/**
 * BarcodeScanner Component
 *
 * Advanced barcode/QR code scanner with:
 * - Multi-format support (UPC, EAN, Code128, QR, DataMatrix, etc.)
 * - Auto-focus and torch control
 * - Batch scanning mode
 * - Part number lookup integration
 * - Asset tracking
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native'
import { RNCamera } from 'react-native-camera'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

const { width, height } = Dimensions.get('window')

export type BarcodeFormat =
  | 'aztec'
  | 'codabar'
  | 'code39'
  | 'code93'
  | 'code128'
  | 'datamatrix'
  | 'ean8'
  | 'ean13'
  | 'itf14'
  | 'maxicode'
  | 'pdf417'
  | 'qr'
  | 'rss14'
  | 'rssexpanded'
  | 'upc_a'
  | 'upc_e'

export interface ScannedItem {
  id: string
  barcode: string
  format: string
  timestamp: Date
  partDetails?: PartDetails
  assetDetails?: AssetDetails
}

export interface PartDetails {
  partNumber: string
  description: string
  manufacturer?: string
  price?: number
  inStock: boolean
  quantity?: number
  location?: string
  imageUrl?: string
}

export interface AssetDetails {
  assetId: string
  assetTag: string
  name: string
  category: string
  assignedTo?: string
  location?: string
  status: 'active' | 'maintenance' | 'retired'
}

export interface BarcodeScannerProps {
  mode: 'single' | 'batch'
  scanType: 'parts' | 'assets' | 'general'
  onScan: (item: ScannedItem) => void
  onBatchComplete?: (items: ScannedItem[]) => void
  onClose: () => void
  enablePartLookup?: boolean
  enableAssetLookup?: boolean
  autoSubmit?: boolean
  barcodeFormats?: BarcodeFormat[]
}

const defaultFormats: BarcodeFormat[] = [
  'qr',
  'code128',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code39',
  'code93',
  'pdf417',
  'datamatrix'
]

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  mode = 'single',
  scanType = 'general',
  onScan,
  onBatchComplete,
  onClose,
  enablePartLookup = true,
  enableAssetLookup = true,
  autoSubmit = false,
  barcodeFormats = defaultFormats
}) => {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [torchOn, setTorchOn] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showBatchList, setShowBatchList] = useState(false)
  const cameraRef = useRef<RNCamera>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
    }
  }, [])

  const getRNBarcodeTypes = () => {
    const typeMap: { [key in BarcodeFormat]: any } = {
      aztec: RNCamera.Constants.BarCodeType.aztec,
      codabar: RNCamera.Constants.BarCodeType.codabar,
      code39: RNCamera.Constants.BarCodeType.code39,
      code93: RNCamera.Constants.BarCodeType.code93,
      code128: RNCamera.Constants.BarCodeType.code128,
      datamatrix: RNCamera.Constants.BarCodeType.datamatrix,
      ean8: RNCamera.Constants.BarCodeType.ean8,
      ean13: RNCamera.Constants.BarCodeType.ean13,
      itf14: RNCamera.Constants.BarCodeType.itf14,
      maxicode: RNCamera.Constants.BarCodeType.maxicode,
      pdf417: RNCamera.Constants.BarCodeType.pdf417,
      qr: RNCamera.Constants.BarCodeType.qr,
      rss14: RNCamera.Constants.BarCodeType.rss14,
      rssexpanded: RNCamera.Constants.BarCodeType.rssexpanded,
      upc_a: RNCamera.Constants.BarCodeType.upc_a,
      upc_e: RNCamera.Constants.BarCodeType.upc_e
    }

    return barcodeFormats.map(format => typeMap[format])
  }

  const lookupPartDetails = async (barcode: string): Promise<PartDetails | undefined> => {
    if (!enablePartLookup || scanType !== 'parts') return undefined

    try {
      const response = await fetch('/api/mobile/parts/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ barcode })
      })

      if (response.ok) {
        const data = await response.json()
        return data.part
      }
    } catch (error) {
      console.error('Error looking up part:', error)
    }

    return undefined
  }

  const lookupAssetDetails = async (barcode: string): Promise<AssetDetails | undefined> => {
    if (!enableAssetLookup || scanType !== 'assets') return undefined

    try {
      const response = await fetch('/api/mobile/assets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ barcode })
      })

      if (response.ok) {
        const data = await response.json()
        return data.asset
      }
    } catch (error) {
      console.error('Error looking up asset:', error)
    }

    return undefined
  }

  const getAuthToken = async (): Promise<string> => {
    // Implement your auth token retrieval logic
    // This is a placeholder
    return 'your-auth-token'
  }

  const handleBarcodeScan = async ({ data, type }: { data: string; type: string }) => {
    if (!scanning || loading) return

    // Check for duplicates in batch mode
    if (mode === 'batch' && scannedItems.some(item => item.barcode === data)) {
      return
    }

    setScanning(false)
    setLoading(true)
    Vibration.vibrate(100)

    try {
      let partDetails: PartDetails | undefined
      let assetDetails: AssetDetails | undefined

      // Lookup details based on scan type
      if (scanType === 'parts') {
        partDetails = await lookupPartDetails(data)
      } else if (scanType === 'assets') {
        assetDetails = await lookupAssetDetails(data)
      }

      const scannedItem: ScannedItem = {
        id: `${Date.now()}-${Math.random()}`,
        barcode: data,
        format: type,
        timestamp: new Date(),
        partDetails,
        assetDetails
      }

      // Call onScan callback
      onScan(scannedItem)

      if (mode === 'batch') {
        setScannedItems(prev => [...prev, scannedItem])

        // Re-enable scanning after a short delay in batch mode
        scanTimeoutRef.current = setTimeout(() => {
          setScanning(true)
          setLoading(false)
        }, 500)
      } else {
        // Single mode - close scanner if auto-submit
        if (autoSubmit) {
          onClose()
        } else {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Error processing barcode:', error)
      Alert.alert('Error', 'Failed to process barcode')
      setScanning(true)
      setLoading(false)
    }
  }

  const toggleTorch = () => {
    setTorchOn(prev => !prev)
  }

  const handleBatchComplete = () => {
    if (scannedItems.length === 0) {
      Alert.alert('No Items', 'Please scan at least one item')
      return
    }

    if (onBatchComplete) {
      onBatchComplete(scannedItems)
    }
    onClose()
  }

  const removeScannedItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id))
  }

  const clearAllScans = () => {
    Alert.alert('Clear All', 'Remove all scanned items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setScannedItems([])
      }
    ])
  }

  const renderScannedItem = ({ item }: { item: ScannedItem }) => (
    <View style={styles.scannedItem}>
      <View style={styles.scannedItemContent}>
        <Icon name="barcode-scan" size={24} color="#4CAF50" />
        <View style={styles.scannedItemDetails}>
          <Text style={styles.scannedItemBarcode}>{item.barcode}</Text>
          <Text style={styles.scannedItemFormat}>{item.format.toUpperCase()}</Text>
          {item.partDetails && (
            <View style={styles.partInfo}>
              <Text style={styles.partNumber}>{item.partDetails.partNumber}</Text>
              <Text style={styles.partDescription}>{item.partDetails.description}</Text>
              {item.partDetails.inStock ? (
                <Text style={styles.inStock}>In Stock</Text>
              ) : (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}
            </View>
          )}
          {item.assetDetails && (
            <View style={styles.assetInfo}>
              <Text style={styles.assetTag}>{item.assetDetails.assetTag}</Text>
              <Text style={styles.assetName}>{item.assetDetails.name}</Text>
              <Text style={styles.assetStatus}>{item.assetDetails.status}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => removeScannedItem(item.id)}>
        <Icon name="close-circle" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={
          torchOn
            ? RNCamera.Constants.FlashMode.torch
            : RNCamera.Constants.FlashMode.off
        }
        onBarCodeRead={handleBarcodeScan}
        barCodeTypes={getRNBarcodeTypes()}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Camera Permission',
          message: 'We need access to your camera to scan barcodes',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel'
        }}
      >
        {/* Scanning overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {scanType === 'parts'
                ? 'Scan Part Barcode'
                : scanType === 'assets'
                ? 'Scan Asset Tag'
                : 'Scan Barcode'}
            </Text>
            <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
              <Icon
                name={torchOn ? 'flashlight' : 'flashlight-off'}
                size={28}
                color={torchOn ? '#FFD700' : '#fff'}
              />
            </TouchableOpacity>
          </View>

          {/* Scanning frame */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.scanInstruction}>
              {loading ? 'Processing...' : 'Align barcode within frame'}
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomBar}>
            {mode === 'batch' && (
              <>
                <TouchableOpacity
                  style={styles.batchButton}
                  onPress={() => setShowBatchList(true)}
                >
                  <Icon name="format-list-bulleted" size={24} color="#fff" />
                  <Text style={styles.batchButtonText}>
                    Scanned ({scannedItems.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    scannedItems.length === 0 && styles.completeButtonDisabled
                  ]}
                  onPress={handleBatchComplete}
                  disabled={scannedItems.length === 0}
                >
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </RNCamera>

      {/* Batch list modal */}
      <Modal
        visible={showBatchList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBatchList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Scanned Items ({scannedItems.length})
              </Text>
              <View style={styles.modalHeaderButtons}>
                {scannedItems.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearAllScans}
                  >
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowBatchList(false)}>
                  <Icon name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={scannedItems}
              renderItem={renderScannedItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.scannedItemsList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No items scanned yet</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  camera: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  closeButton: {
    padding: 5
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  torchButton: {
    padding: 5
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 4
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0
  },
  scanInstruction: {
    marginTop: 30,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  batchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  batchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8
  },
  completeButtonDisabled: {
    backgroundColor: '#999'
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f44336',
    borderRadius: 6
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  scannedItemsList: {
    padding: 20
  },
  scannedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  scannedItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  scannedItemDetails: {
    flex: 1,
    marginLeft: 12
  },
  scannedItemBarcode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  scannedItemFormat: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  partInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  partNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3'
  },
  partDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  inStock: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4
  },
  outOfStock: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
    marginTop: 4
  },
  assetInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  assetTag: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800'
  },
  assetName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  assetStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40
  }
})

export default BarcodeScanner
