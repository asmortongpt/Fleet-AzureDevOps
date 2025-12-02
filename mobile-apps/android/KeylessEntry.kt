/**
 * KeylessEntry.kt
 * Fleet Manager - Keyless Vehicle Entry for Android
 *
 * Bluetooth Low Energy and NFC-based keyless entry system
 * with encrypted keys and time-limited access
 */

package com.fleet.manager.keyless

import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.nfc.*
import android.nfc.tech.Ndef
import android.os.ParcelUuid
import androidx.compose.runtime.*
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.security.KeyStore
import java.util.*
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlin.math.pow

// MARK: - Keyless Entry Manager

class KeylessEntryManager(private val context: Context) {
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val bluetoothLeScanner: BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner
    private var bluetoothGatt: BluetoothGatt? = null
    private var nfcAdapter: NfcAdapter? = NfcAdapter.getDefaultAdapter(context)

    // Service UUIDs
    private val vehicleServiceUUID = UUID.fromString("12345678-1234-1234-1234-123456789ABC")
    private val unlockCharacteristicUUID = UUID.fromString("12345678-1234-1234-1234-123456789ABD")
    private val statusCharacteristicUUID = UUID.fromString("12345678-1234-1234-1234-123456789ABE")

    // State
    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning

    private val _nearbyVehicles = MutableStateFlow<List<VehicleBeacon>>(emptyList())
    val nearbyVehicles: StateFlow<List<VehicleBeacon>> = _nearbyVehicles

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus

    private val _unlockStatus = MutableStateFlow(UnlockStatus.LOCKED)
    val unlockStatus: StateFlow<UnlockStatus> = _unlockStatus

    // Security
    private var vehicleKey: SecretKey? = null
    private var accessToken: String? = null
    private var tokenExpiry: Long? = null

    companion object {
        private const val KEYSTORE_ALIAS = "fleet_vehicle_key"
        private const val PREFS_NAME = "keyless_entry"
        private const val PREF_ACCESS_TOKEN = "access_token"
        private const val PREF_TOKEN_EXPIRY = "token_expiry"
    }

    init {
        loadStoredCredentials()
    }

    // MARK: - Credential Management

    private fun loadStoredCredentials() {
        // Load key from Android KeyStore
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)

            if (keyStore.containsAlias(KEYSTORE_ALIAS)) {
                vehicleKey = keyStore.getKey(KEYSTORE_ALIAS, null) as? SecretKey
            }
        } catch (e: Exception) {
            println("Error loading key: ${e.message}")
        }

        // Load token and expiry from SharedPreferences
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        accessToken = prefs.getString(PREF_ACCESS_TOKEN, null)
        tokenExpiry = prefs.getLong(PREF_TOKEN_EXPIRY, 0).takeIf { it > 0 }
    }

    fun setVehicleCredentials(vehicleId: String, token: String, expiryHours: Int = 24) {
        // Generate and store encryption key
        val keyGenerator = KeyGenerator.getInstance("AES", "AndroidKeyStore")
        keyGenerator.init(256)
        vehicleKey = keyGenerator.generateKey()

        // Store access token
        accessToken = token
        tokenExpiry = System.currentTimeMillis() + (expiryHours * 3600 * 1000)

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(PREF_ACCESS_TOKEN, token)
            putLong(PREF_TOKEN_EXPIRY, tokenExpiry!!)
            apply()
        }

        println("Vehicle credentials set for $vehicleId, expires at ${Date(tokenExpiry!!)}")
    }

    private fun isTokenValid(): Boolean {
        val expiry = tokenExpiry ?: return false
        return System.currentTimeMillis() < expiry
    }

    // MARK: - Bluetooth Scanning

    fun startScanning() {
        if (!isTokenValid()) {
            println("Access token expired")
            return
        }

        _isScanning.value = true
        _nearbyVehicles.value = emptyList()

        val scanSettings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        val scanFilter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid(vehicleServiceUUID))
            .build()

        bluetoothLeScanner?.startScan(listOf(scanFilter), scanSettings, scanCallback)
        println("Started scanning for vehicles...")
    }

    fun stopScanning() {
        bluetoothLeScanner?.stopScan(scanCallback)
        _isScanning.value = false
        println("Stopped scanning")
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val device = result.device
            val rssi = result.rssi
            val name = device.name ?: "Unknown Vehicle"
            val distance = calculateDistance(rssi.toDouble())

            val vehicle = VehicleBeacon(
                id = device.address,
                name = name,
                distance = distance,
                rssi = rssi,
                device = device
            )

            val currentVehicles = _nearbyVehicles.value.toMutableList()
            if (!currentVehicles.any { it.id == vehicle.id }) {
                currentVehicles.add(vehicle)
                _nearbyVehicles.value = currentVehicles
                println("Discovered vehicle: $name at ${distance}m")
            }
        }

        override fun onScanFailed(errorCode: Int) {
            println("Scan failed with error: $errorCode")
            _isScanning.value = false
        }
    }

    // MARK: - Vehicle Connection

    fun connect(vehicle: VehicleBeacon) {
        _connectionStatus.value = ConnectionStatus.CONNECTING
        bluetoothGatt = vehicle.device?.connectGatt(context, false, gattCallback)
        println("Connecting to ${vehicle.name}...")
    }

    fun disconnect() {
        bluetoothGatt?.disconnect()
        bluetoothGatt?.close()
        bluetoothGatt = null
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    println("Connected to vehicle")
                    _connectionStatus.value = ConnectionStatus.CONNECTED
                    gatt.discoverServices()
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    println("Disconnected from vehicle")
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                }
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                val service = gatt.getService(vehicleServiceUUID)
                val statusChar = service?.getCharacteristic(statusCharacteristicUUID)

                statusChar?.let {
                    gatt.readCharacteristic(it)
                    gatt.setCharacteristicNotification(it, true)
                }
            }
        }

        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            if (characteristic.uuid == statusCharacteristicUUID) {
                val status = characteristic.getStringValue(0)
                _unlockStatus.value = if (status == "unlocked") UnlockStatus.UNLOCKED else UnlockStatus.LOCKED
            }
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic
        ) {
            if (characteristic.uuid == statusCharacteristicUUID) {
                val status = characteristic.getStringValue(0)
                _unlockStatus.value = if (status == "unlocked") UnlockStatus.UNLOCKED else UnlockStatus.LOCKED
            }
        }
    }

    // MARK: - Unlock/Lock Operations

    fun unlockVehicle() {
        val gatt = bluetoothGatt ?: return
        val key = vehicleKey ?: return
        val token = accessToken ?: return

        val timestamp = System.currentTimeMillis()
        val command = """{"action":"unlock","token":"$token","timestamp":$timestamp}"""

        val encryptedData = encryptData(command.toByteArray(), key)

        sendCommand(gatt, encryptedData)

        _unlockStatus.value = UnlockStatus.UNLOCKED
    }

    fun lockVehicle() {
        val gatt = bluetoothGatt ?: return
        val key = vehicleKey ?: return
        val token = accessToken ?: return

        val timestamp = System.currentTimeMillis()
        val command = """{"action":"lock","token":"$token","timestamp":$timestamp}"""

        val encryptedData = encryptData(command.toByteArray(), key)

        sendCommand(gatt, encryptedData)

        _unlockStatus.value = UnlockStatus.LOCKED
    }

    private fun sendCommand(gatt: BluetoothGatt, data: ByteArray) {
        val service = gatt.getService(vehicleServiceUUID)
        val characteristic = service?.getCharacteristic(unlockCharacteristicUUID)

        characteristic?.let {
            it.value = data
            it.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
            gatt.writeCharacteristic(it)
            println("Command sent")
        }
    }

    // MARK: - NFC Operations

    fun handleNfcIntent(intent: android.content.Intent) {
        if (!isTokenValid()) {
            println("Access token expired")
            return
        }

        val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG) ?: return
        val ndef = Ndef.get(tag)

        ndef?.connect()
        val ndefMessage = ndef?.ndefMessage

        ndefMessage?.records?.forEach { record ->
            val payload = String(record.payload)
            if (payload.startsWith("FLEET:")) {
                val vehicleId = payload.removePrefix("FLEET:")
                println("NFC detected vehicle: $vehicleId")
                unlockViaNFC(vehicleId)
            }
        }

        ndef?.close()
    }

    private fun unlockViaNFC(vehicleId: String) {
        // Simulate NFC unlock
        println("NFC unlock command sent for vehicle $vehicleId")
        _unlockStatus.value = UnlockStatus.UNLOCKED
    }

    // MARK: - Security/Encryption

    private fun encryptData(data: ByteArray, key: SecretKey): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)

        val iv = cipher.iv
        val encryptedData = cipher.doFinal(data)

        // Combine IV and encrypted data
        return iv + encryptedData
    }

    private fun calculateDistance(rssi: Double): Double {
        val txPower = -59.0 // Calibrated at 1 meter
        if (rssi == 0.0) return -1.0

        val ratio = rssi / txPower
        return if (ratio < 1.0) {
            ratio.pow(10)
        } else {
            0.89976 * ratio.pow(7.7095) + 0.111
        }
    }

    // MARK: - Cloud Backup

    fun requestCloudUnlock(vehicleId: String, callback: (Boolean) -> Unit) {
        // Cloud-based unlock fallback
        // Implementation would use OkHttp or Retrofit
        println("Cloud unlock requested for vehicle $vehicleId")
        callback(true)
    }
}

// MARK: - Data Models

data class VehicleBeacon(
    val id: String,
    val name: String,
    val distance: Double,
    val rssi: Int,
    val device: BluetoothDevice?
)

enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED
}

enum class UnlockStatus {
    LOCKED,
    UNLOCKING,
    UNLOCKED
}

// MARK: - Jetpack Compose UI

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.*
import androidx.compose.ui.graphics.Color

@Composable
fun KeylessEntryScreen(manager: KeylessEntryManager) {
    val isScanning by manager.isScanning.collectAsState()
    val nearbyVehicles by manager.nearbyVehicles.collectAsState()
    val connectionStatus by manager.connectionStatus.collectAsState()
    val unlockStatus by manager.unlockStatus.collectAsState()

    Column(
        modifier = androidx.compose.ui.Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Connection status
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Box(
                modifier = androidx.compose.ui.Modifier.size(12.dp),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) {
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = if (connectionStatus == ConnectionStatus.CONNECTED) Color.Green else Color.Gray
                ) {}
            }
            Spacer(modifier = androidx.compose.ui.Modifier.width(8.dp))
            Text(
                when (connectionStatus) {
                    ConnectionStatus.DISCONNECTED -> "Not Connected"
                    ConnectionStatus.CONNECTING -> "Connecting..."
                    ConnectionStatus.CONNECTED -> "Connected"
                }
            )
        }

        // Unlock button
        Button(
            onClick = {
                if (unlockStatus == UnlockStatus.LOCKED) {
                    manager.unlockVehicle()
                } else {
                    manager.lockVehicle()
                }
            },
            modifier = androidx.compose.ui.Modifier.size(150.dp),
            enabled = connectionStatus == ConnectionStatus.CONNECTED,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (unlockStatus == UnlockStatus.UNLOCKED) Color.Green else Color.Blue
            )
        ) {
            Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                Icon(
                    if (unlockStatus == UnlockStatus.UNLOCKED) Icons.Default.LockOpen else Icons.Default.Lock,
                    contentDescription = "Lock",
                    modifier = androidx.compose.ui.Modifier.size(48.dp)
                )
                Text(if (unlockStatus == UnlockStatus.UNLOCKED) "Lock" else "Unlock")
            }
        }

        // Scan button
        if (isScanning) {
            CircularProgressIndicator()
            Text("Scanning...")
        } else {
            Button(onClick = { manager.startScanning() }) {
                Text("Scan for Vehicles")
            }
        }

        // Nearby vehicles list
        LazyColumn {
            items(nearbyVehicles) { vehicle ->
                Card(
                    modifier = androidx.compose.ui.Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = androidx.compose.ui.Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Column {
                            Text(vehicle.name, style = MaterialTheme.typography.bodyLarge)
                            Text(
                                "${"%.1f".format(vehicle.distance)}m away",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }

                        Button(onClick = { manager.connect(vehicle) }) {
                            Text("Connect")
                        }
                    }
                }
            }
        }

        // NFC button
        Button(
            onClick = { /* Trigger NFC */ },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF9800))
        ) {
            Text("Unlock via NFC")
        }
    }
}
