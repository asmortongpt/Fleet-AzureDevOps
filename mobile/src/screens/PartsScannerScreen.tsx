/**
 * PartsScannerScreen
 *
 * Comprehensive parts scanning and inventory management screen with:
 * - Scan part barcodes
 * - Look up part details from inventory
 * - Add parts to work orders
 * - Check inventory levels
 * - Order parts
 * - View part history
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  FlatList,
  Platform
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import BarcodeScanner, { ScannedItem, PartDetails } from '../components/BarcodeScanner'

export interface PartsScannerScreenProps {
  workOrderId?: string
  vehicleId?: string
  authToken: string
  onClose?: () => void
}

export interface PartOrder {
  partNumber: string
  quantity: number
  price: number
  notes?: string
}

export interface WorkOrderPart {
  id: string
  partNumber: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: 'pending' | 'ordered' | 'received' | 'installed'
}

export const PartsScannerScreen: React.FC<PartsScannerScreenProps> = ({
  workOrderId,
  vehicleId,
  authToken,
  onClose
}) => {
  const [showScanner, setShowScanner] = useState(false)
  const [scannedParts, setScannedParts] = useState<ScannedItem[]>([])
  const [selectedPart, setSelectedPart] = useState<PartDetails | null>(null)
  const [showPartDetails, setShowPartDetails] = useState(false)
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [workOrderParts, setWorkOrderParts] = useState<WorkOrderPart[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PartDetails[]>([])

  useEffect(() => {
    if (workOrderId) {
      loadWorkOrderParts()
    }
  }, [workOrderId])

  const loadWorkOrderParts = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/mobile/work-orders/${workOrderId}/parts`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setWorkOrderParts(data.parts || [])
      }
    } catch (error) {
      console.error('Error loading work order parts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (scannedItem: ScannedItem) => {
    setScannedParts(prev => [...prev, scannedItem])
    setShowScanner(false)

    if (scannedItem.partDetails) {
      setSelectedPart(scannedItem.partDetails)
      setShowPartDetails(true)
    } else {
      Alert.alert(
        'Part Not Found',
        `Part ${scannedItem.barcode} not found in inventory. Would you like to search for it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Search',
            onPress: () => {
              setSearchQuery(scannedItem.barcode)
              searchParts(scannedItem.barcode)
            }
          }
        ]
      )
    }
  }

  const handleBatchComplete = (items: ScannedItem[]) => {
    setScannedParts(prev => [...prev, ...items])
    setShowScanner(false)

    const partsWithDetails = items.filter(item => item.partDetails)
    if (partsWithDetails.length > 0) {
      Alert.alert(
        'Batch Scan Complete',
        `Found ${partsWithDetails.length} parts. Add them to work order?`,
        [
          { text: 'Review', style: 'cancel' },
          {
            text: 'Add All',
            onPress: () => addBatchToWorkOrder(partsWithDetails)
          }
        ]
      )
    }
  }

  const addBatchToWorkOrder = async (items: ScannedItem[]) => {
    if (!workOrderId) {
      Alert.alert('Error', 'No work order selected')
      return
    }

    setLoading(true)
    try {
      const parts = items.map(item => ({
        partNumber: item.partDetails!.partNumber,
        quantity: 1,
        unitPrice: item.partDetails!.price || 0
      }))

      const response = await fetch(
        `/api/mobile/work-orders/${workOrderId}/parts/batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ parts })
        }
      )

      if (response.ok) {
        await loadWorkOrderParts()
        Alert.alert('Success', `Added ${parts.length} parts to work order`)
      } else {
        const error = await response.json()
        Alert.alert('Error', error.message || 'Failed to add parts')
      }
    } catch (error) {
      console.error('Error adding batch parts:', error)
      Alert.alert('Error', 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const searchParts = async (query: string) => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/mobile/parts/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.parts || [])
      }
    } catch (error) {
      console.error('Error searching parts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToWorkOrder = async () => {
    if (!selectedPart || !workOrderId) return

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/mobile/work-orders/${workOrderId}/parts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            partNumber: selectedPart.partNumber,
            quantity: qty,
            unitPrice: selectedPart.price || 0,
            notes
          })
        }
      )

      if (response.ok) {
        await loadWorkOrderParts()
        setShowPartDetails(false)
        setSelectedPart(null)
        setQuantity('1')
        setNotes('')
        Alert.alert('Success', 'Part added to work order')
      } else {
        const error = await response.json()
        Alert.alert('Error', error.message || 'Failed to add part')
      }
    } catch (error) {
      console.error('Error adding part to work order:', error)
      Alert.alert('Error', 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const orderPart = async () => {
    if (!selectedPart) return

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity')
      return
    }

    Alert.alert(
      'Order Part',
      `Order ${qty} x ${selectedPart.partNumber}?\nTotal: $${((selectedPart.price || 0) * qty).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Order',
          onPress: async () => {
            setLoading(true)
            try {
              const response = await fetch('/api/mobile/parts/order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  partNumber: selectedPart.partNumber,
                  quantity: qty,
                  workOrderId,
                  vehicleId,
                  notes
                })
              })

              if (response.ok) {
                Alert.alert('Success', 'Part ordered successfully')
                setShowPartDetails(false)
                setSelectedPart(null)
                setQuantity('1')
                setNotes('')
              } else {
                const error = await response.json()
                Alert.alert('Error', error.message || 'Failed to order part')
              }
            } catch (error) {
              console.error('Error ordering part:', error)
              Alert.alert('Error', 'Network error')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const renderPartDetails = () => {
    if (!selectedPart) return null

    return (
      <Modal
        visible={showPartDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPartDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.partDetailsModal}>
            <View style={styles.partDetailsHeader}>
              <Text style={styles.partDetailsTitle}>Part Details</Text>
              <TouchableOpacity onPress={() => setShowPartDetails(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.partDetailsContent}>
              {selectedPart.imageUrl && (
                <Image
                  source={{ uri: selectedPart.imageUrl }}
                  style={styles.partImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.partInfoSection}>
                <View style={styles.partInfoRow}>
                  <Text style={styles.partInfoLabel}>Part Number:</Text>
                  <Text style={styles.partInfoValue}>
                    {selectedPart.partNumber}
                  </Text>
                </View>

                <View style={styles.partInfoRow}>
                  <Text style={styles.partInfoLabel}>Description:</Text>
                  <Text style={styles.partInfoValue}>
                    {selectedPart.description}
                  </Text>
                </View>

                {selectedPart.manufacturer && (
                  <View style={styles.partInfoRow}>
                    <Text style={styles.partInfoLabel}>Manufacturer:</Text>
                    <Text style={styles.partInfoValue}>
                      {selectedPart.manufacturer}
                    </Text>
                  </View>
                )}

                {selectedPart.price !== undefined && (
                  <View style={styles.partInfoRow}>
                    <Text style={styles.partInfoLabel}>Price:</Text>
                    <Text style={[styles.partInfoValue, styles.priceText]}>
                      ${selectedPart.price.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.partInfoRow}>
                  <Text style={styles.partInfoLabel}>Stock Status:</Text>
                  <View style={styles.stockBadge}>
                    <Icon
                      name={selectedPart.inStock ? 'check-circle' : 'alert-circle'}
                      size={16}
                      color={selectedPart.inStock ? '#4CAF50' : '#f44336'}
                    />
                    <Text
                      style={[
                        styles.stockText,
                        { color: selectedPart.inStock ? '#4CAF50' : '#f44336' }
                      ]}
                    >
                      {selectedPart.inStock ? 'In Stock' : 'Out of Stock'}
                    </Text>
                  </View>
                </View>

                {selectedPart.quantity !== undefined && (
                  <View style={styles.partInfoRow}>
                    <Text style={styles.partInfoLabel}>Available:</Text>
                    <Text style={styles.partInfoValue}>
                      {selectedPart.quantity} units
                    </Text>
                  </View>
                )}

                {selectedPart.location && (
                  <View style={styles.partInfoRow}>
                    <Text style={styles.partInfoLabel}>Location:</Text>
                    <Text style={styles.partInfoValue}>
                      {selectedPart.location}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.quantitySection}>
                <Text style={styles.sectionLabel}>Quantity:</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const qty = Math.max(1, parseInt(quantity, 10) - 1)
                      setQuantity(qty.toString())
                    }}
                  >
                    <Icon name="minus" size={24} color="#2196F3" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const qty = parseInt(quantity, 10) + 1
                      setQuantity(qty.toString())
                    }}
                  >
                    <Icon name="plus" size={24} color="#2196F3" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.notesSection}>
                <Text style={styles.sectionLabel}>Notes (Optional):</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about this part..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  ${((selectedPart.price || 0) * parseInt(quantity, 10)).toFixed(2)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.partDetailsActions}>
              {workOrderId && (
                <TouchableOpacity
                  style={styles.addToWorkOrderButton}
                  onPress={addToWorkOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="clipboard-plus" size={20} color="#fff" />
                      <Text style={styles.addToWorkOrderButtonText}>
                        Add to Work Order
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!selectedPart.inStock && (
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={orderPart}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="cart-plus" size={20} color="#fff" />
                      <Text style={styles.orderButtonText}>Order Part</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  const renderWorkOrderPart = ({ item }: { item: WorkOrderPart }) => (
    <View style={styles.workOrderPart}>
      <View style={styles.workOrderPartInfo}>
        <Text style={styles.workOrderPartNumber}>{item.partNumber}</Text>
        <Text style={styles.workOrderPartDescription}>{item.description}</Text>
        <View style={styles.workOrderPartDetails}>
          <Text style={styles.workOrderPartQuantity}>Qty: {item.quantity}</Text>
          <Text style={styles.workOrderPartPrice}>
            ${item.totalPrice.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.workOrderPartStatus}>
        <Text
          style={[
            styles.workOrderPartStatusText,
            { color: getStatusColor(item.status) }
          ]}
        >
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  )

  const getStatusColor = (status: WorkOrderPart['status']) => {
    switch (status) {
      case 'installed':
        return '#4CAF50'
      case 'received':
        return '#2196F3'
      case 'ordered':
        return '#FF9800'
      default:
        return '#999'
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-left" size={28} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Parts Scanner</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search parts by number or description..."
            placeholderTextColor="#999"
            onSubmitEditing={() => searchParts(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Scanner button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Icon name="barcode-scan" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        {/* Work order parts */}
        {workOrderId && (
          <View style={styles.workOrderSection}>
            <Text style={styles.sectionTitle}>
              Work Order Parts ({workOrderParts.length})
            </Text>
            {workOrderParts.length > 0 ? (
              <FlatList
                data={workOrderParts}
                renderItem={renderWorkOrderPart}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>No parts added yet</Text>
            )}
          </View>
        )}

        {/* Scanned parts history */}
        {scannedParts.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>
              Recently Scanned ({scannedParts.length})
            </Text>
            {scannedParts.slice(-5).reverse().map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => {
                  if (item.partDetails) {
                    setSelectedPart(item.partDetails)
                    setShowPartDetails(true)
                  }
                }}
              >
                <Icon
                  name="barcode"
                  size={24}
                  color={item.partDetails ? '#4CAF50' : '#999'}
                />
                <View style={styles.historyItemInfo}>
                  <Text style={styles.historyItemBarcode}>{item.barcode}</Text>
                  {item.partDetails && (
                    <Text style={styles.historyItemDescription}>
                      {item.partDetails.description}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Scanner Modal */}
      {showScanner && (
        <Modal visible={showScanner} animationType="slide">
          <BarcodeScanner
            mode="single"
            scanType="parts"
            onScan={handleScan}
            onBatchComplete={handleBatchComplete}
            onClose={() => setShowScanner(false)}
            enablePartLookup={true}
            autoSubmit={false}
          />
        </Modal>
      )}

      {/* Part Details Modal */}
      {renderPartDetails()}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
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
    flex: 1,
    padding: 20
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  workOrderSection: {
    marginBottom: 30
  },
  workOrderPart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  workOrderPartInfo: {
    flex: 1
  },
  workOrderPartNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4
  },
  workOrderPartDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  workOrderPartDetails: {
    flexDirection: 'row',
    gap: 15
  },
  workOrderPartQuantity: {
    fontSize: 13,
    color: '#666'
  },
  workOrderPartPrice: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600'
  },
  workOrderPartStatus: {
    marginLeft: 10
  },
  workOrderPartStatusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  historySection: {
    marginBottom: 30
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  historyItemInfo: {
    flex: 1,
    marginLeft: 12
  },
  historyItemBarcode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  historyItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  partDetailsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%'
  },
  partDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  partDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  partDetailsContent: {
    padding: 20
  },
  partImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f5f5f5'
  },
  partInfoSection: {
    marginBottom: 20
  },
  partInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  partInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  partInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10
  },
  priceText: {
    color: '#4CAF50',
    fontSize: 16
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600'
  },
  quantitySection: {
    marginBottom: 20
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20
  },
  quantityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityInput: {
    width: 80,
    height: 50,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  notesSection: {
    marginBottom: 20
  },
  notesInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3'
  },
  partDetailsActions: {
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  addToWorkOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    gap: 8
  },
  addToWorkOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 10,
    gap: 8
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default PartsScannerScreen
