/**
 * Mobile OCR Integration Example
 *
 * Complete example showing how to integrate fuel receipt and odometer
 * OCR capture into your Fleet mobile app.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import FuelReceiptCapture from '../components/FuelReceiptCapture';
import OdometerCapture from '../components/OdometerCapture';
import OCRService from '../services/OCRService';

// Example: Main Fleet App Screen with OCR features
export function FleetActionsScreen({ navigation, route }) {
  const { vehicleId, vehicleName, driverId, lastOdometerReading } = route.params;

  const [showReceiptCapture, setShowReceiptCapture] = useState(false);
  const [showOdometerCapture, setShowOdometerCapture] = useState(false);

  return (
    <View style={styles.container}>
      {!showReceiptCapture && !showOdometerCapture ? (
        <ScrollView style={styles.actionsList}>
          <View style={styles.header}>
            <Text style={styles.title}>{vehicleName}</Text>
            <Text style={styles.subtitle}>Vehicle Actions</Text>
          </View>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowReceiptCapture(true)}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.iconText}>🧾</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add Fuel Receipt</Text>
              <Text style={styles.actionDescription}>
                Capture receipt and extract transaction details
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowOdometerCapture(true)}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Record Odometer</Text>
              <Text style={styles.actionDescription}>
                Capture odometer reading with photo verification
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : showReceiptCapture ? (
        <FuelReceiptCapture
          vehicleId={vehicleId}
          driverId={driverId}
          onSave={async (data) => {
            try {
              // Upload to backend
              const result = await OCRService.uploadAndProcessReceipt(
                data.photoUri,
                vehicleId,
                driverId,
                'https://api.yourfleet.com',
                'YOUR_AUTH_TOKEN' // Get from auth context
              );

              Alert.alert(
                'Success',
                `Fuel receipt saved successfully!\n\n` +
                `Station: ${data.station}\n` +
                `Gallons: ${data.gallons}\n` +
                `Total: $${data.totalCost.toFixed(2)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setShowReceiptCapture(false);
                      // Optionally navigate to transaction list
                      // navigation.navigate('FuelTransactions');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Failed to save receipt:', error);
              Alert.alert('Error', 'Failed to save fuel receipt');
            }
          }}
          onCancel={() => setShowReceiptCapture(false)}
        />
      ) : (
        <OdometerCapture
          vehicleId={vehicleId}
          lastReading={lastOdometerReading}
          lastReadingDate="2024-01-15"
          onSave={async (data) => {
            try {
              // Upload to backend
              const result = await OCRService.uploadAndProcessOdometer(
                data.photoUri,
                vehicleId,
                undefined, // tripId
                undefined, // reservationId
                'https://api.yourfleet.com',
                'YOUR_AUTH_TOKEN' // Get from auth context
              );

              Alert.alert(
                'Success',
                `Odometer reading saved successfully!\n\n` +
                `Reading: ${data.reading.toLocaleString()} ${data.unit}\n` +
                `Confidence: ${(data.confidence * 100).toFixed(0)}%`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setShowOdometerCapture(false);
                      // Optionally navigate back or refresh
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Failed to save odometer:', error);
              Alert.alert('Error', 'Failed to save odometer reading');
            }
          }}
          onCancel={() => setShowOdometerCapture(false)}
        />
      )}
    </View>
  );
}

// Example: Trip Start/End with Odometer
export function TripOdometerScreen({ navigation, route }) {
  const { tripId, vehicleId, isStart } = route.params;

  return (
    <OdometerCapture
      vehicleId={vehicleId}
      tripId={tripId}
      onSave={async (data) => {
        try {
          // Save odometer with trip linkage
          const endpoint = isStart
            ? '/api/trips/start-odometer'
            : '/api/trips/end-odometer';

          const response = await fetch(
            `https://api.yourfleet.com${endpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer YOUR_TOKEN',
              },
              body: JSON.stringify({
                tripId,
                reading: data.reading,
                unit: data.unit,
                photoUri: data.photoUri,
                confidence: data.confidence,
              }),
            }
          );

          if (response.ok) {
            Alert.alert(
              'Success',
              `${isStart ? 'Start' : 'End'} odometer recorded: ${data.reading.toLocaleString()} ${data.unit}`
            );
            navigation.goBack();
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to save odometer reading');
        }
      }}
      onCancel={() => navigation.goBack()}
    />
  );
}

// Example: Fuel Log with Automatic Receipt Capture
export function FuelLogScreen({ navigation, route }) {
  const { vehicleId, driverId } = route.params;
  const [manualEntry, setManualEntry] = useState(false);

  if (manualEntry) {
    // Show manual fuel entry form
    return <ManualFuelEntryForm />;
  }

  return (
    <View style={styles.container}>
      <FuelReceiptCapture
        vehicleId={vehicleId}
        driverId={driverId}
        onSave={async (data) => {
          try {
            // Upload receipt
            await OCRService.uploadAndProcessReceipt(
              data.photoUri,
              vehicleId,
              driverId,
              'https://api.yourfleet.com',
              'YOUR_AUTH_TOKEN'
            );

            // Show success and navigate to fuel log
            Alert.alert('Success', 'Fuel transaction recorded', [
              {
                text: 'View Log',
                onPress: () => navigation.navigate('FuelTransactions'),
              },
              {
                text: 'Add Another',
                onPress: () => {
                  // Component will reset
                },
              },
            ]);
          } catch (error) {
            Alert.alert(
              'Error',
              'Failed to save fuel receipt. Try manual entry?',
              [
                {
                  text: 'Manual Entry',
                  onPress: () => setManualEntry(true),
                },
                { text: 'Retry', onPress: () => {} },
              ]
            );
          }
        }}
        onCancel={() => {
          Alert.alert(
            'Cancel Receipt Capture',
            'Would you like to enter fuel data manually?',
            [
              {
                text: 'Manual Entry',
                onPress: () => setManualEntry(true),
              },
              { text: 'Go Back', onPress: () => navigation.goBack() },
            ]
          );
        }}
      />
    </View>
  );
}

// Example: Using OCR Service Directly
export async function directOCRExample() {
  // Initialize OCR service (done automatically)
  await OCRService.initialize();

  // Process fuel receipt from camera
  const receiptImageUri = 'file:///path/to/receipt.jpg';
  try {
    const receiptData = await OCRService.processFuelReceipt(receiptImageUri);

    console.log('Receipt Data:', {
      station: receiptData.station,
      date: receiptData.date,
      gallons: receiptData.gallons,
      pricePerGallon: receiptData.pricePerGallon,
      totalCost: receiptData.totalCost,
      confidence: receiptData.confidenceScores,
    });

    // Check confidence scores
    Object.entries(receiptData.confidenceScores || {}).forEach(
      ([field, score]) => {
        if (score < 0.8) {
          console.warn(`Low confidence for ${field}: ${score}`);
        }
      }
    );
  } catch (error) {
    console.error('Receipt OCR failed:', error);
  }

  // Process odometer reading
  const odometerImageUri = 'file:///path/to/odometer.jpg';
  try {
    const odometerData = await OCRService.processOdometer(odometerImageUri);

    console.log('Odometer Data:', {
      reading: odometerData.reading,
      unit: odometerData.unit,
      confidence: odometerData.confidence,
    });

    // Validate reading
    if (odometerData.confidence < 0.85) {
      console.warn('Low confidence odometer reading');
      // Prompt user to verify
    }
  } catch (error) {
    console.error('Odometer OCR failed:', error);
  }
}

// Example: Batch OCR Processing
export async function batchOCRExample() {
  const receipts = [
    'file:///path/to/receipt1.jpg',
    'file:///path/to/receipt2.jpg',
    'file:///path/to/receipt3.jpg',
  ];

  const results = await Promise.allSettled(
    receipts.map((uri) => OCRService.processFuelReceipt(uri))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Receipt ${index + 1} processed:`, result.value);
    } else {
      console.error(`Receipt ${index + 1} failed:`, result.reason);
    }
  });
}

// Example: OCR with Validation
export async function ocrWithValidationExample() {
  const imageUri = 'file:///path/to/receipt.jpg';

  try {
    // Process with OCR
    const receiptData = await OCRService.processFuelReceipt(imageUri);

    // Validate with backend
    const validationResponse = await fetch(
      'https://api.yourfleet.com/api/mobile/ocr/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_TOKEN',
        },
        body: JSON.stringify({
          type: 'fuel-receipt',
          data: receiptData,
        }),
      }
    );

    const validation = await validationResponse.json();

    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      // Show errors to user for correction
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
      // Show warnings to user
    }

    return { receiptData, validation };
  } catch (error) {
    console.error('OCR with validation failed:', error);
    throw error;
  }
}

// Placeholder for manual entry form
function ManualFuelEntryForm() {
  return (
    <View style={styles.container}>
      <Text>Manual Fuel Entry Form</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  actionsList: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
    marginLeft: 8,
  },
});

// Navigation setup example (React Navigation)
export const OCRNavigationSetup = () => {
  /*
  import { createStackNavigator } from '@react-navigation/stack';

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FleetActions"
        component={FleetActionsScreen}
        options={{ title: 'Vehicle Actions' }}
      />
      <Stack.Screen
        name="FuelReceipt"
        component={FuelLogScreen}
        options={{ title: 'Add Fuel Receipt', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Odometer"
        component={TripOdometerScreen}
        options={{ title: 'Record Odometer', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
  */
};

export default {
  FleetActionsScreen,
  TripOdometerScreen,
  FuelLogScreen,
  directOCRExample,
  batchOCRExample,
  ocrWithValidationExample,
};
