/**
 * Barcode Scanner for Android - ML Kit
 * Supports all barcode formats with CameraX
 * Real-time detection with batch scanning mode
 */

package com.capitaltechalliance.fleet.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class BarcodeScannerActivity : ComponentActivity() {
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            setContent {
                BarcodeScannerScreen(
                    onScan = { value, format -> handleScan(value, format) },
                    onDismiss = { finish() }
                )
            }
        } else {
            Toast.makeText(this, "Camera permission is required", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                setContent {
                    BarcodeScannerScreen(
                        onScan = { value, format -> handleScan(value, format) },
                        onDismiss = { finish() }
                    )
                }
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    private fun handleScan(value: String, format: String) {
        // Return result to calling activity
        val intent = intent.apply {
            putExtra("BARCODE_VALUE", value)
            putExtra("BARCODE_FORMAT", format)
        }
        setResult(RESULT_OK, intent)
        finish()
    }
}

@Composable
fun BarcodeScannerScreen(
    onScan: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var lastScannedBarcode by remember { mutableStateOf<Pair<String, String>?>(null) }
    var isTorchOn by remember { mutableStateOf(false) }
    var cameraControl by remember { mutableStateOf<CameraControl?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scan Barcode") },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "Close")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        cameraControl?.let {
                            it.enableTorch(!isTorchOn)
                            isTorchOn = !isTorchOn
                        }
                    }) {
                        Icon(
                            if (isTorchOn) Icons.Default.FlashlightOn else Icons.Default.FlashlightOff,
                            "Toggle Flashlight"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            CameraPreview(
                modifier = Modifier.fillMaxSize(),
                onBarcodeScanned = { value, format ->
                    if (lastScannedBarcode?.first != value) {
                        lastScannedBarcode = Pair(value, format)
                    }
                },
                onCameraReady = { control ->
                    cameraControl = control
                }
            )

            // Scanning frame overlay
            Canvas(modifier = Modifier.fillMaxSize()) {
                val frameWidth = size.width * 0.75f
                val frameHeight = size.height * 0.35f
                val frameLeft = (size.width - frameWidth) / 2
                val frameTop = (size.height - frameHeight) / 2

                // Semi-transparent overlay
                drawRect(
                    color = Color.Black.copy(alpha = 0.5f),
                    size = size
                )

                // Clear scanning area
                drawRect(
                    color = Color.Transparent,
                    topLeft = Offset(frameLeft, frameTop),
                    size = Size(frameWidth, frameHeight),
                    blendMode = androidx.compose.ui.graphics.BlendMode.Clear
                )

                // Scanning frame border
                drawRoundRect(
                    color = Color.Green,
                    topLeft = Offset(frameLeft, frameTop),
                    size = Size(frameWidth, frameHeight),
                    cornerRadius = CornerRadius(16f, 16f),
                    style = Stroke(width = 4f)
                )

                // Corner indicators
                val cornerLength = 30f
                val corners = listOf(
                    // Top-left
                    Pair(Offset(frameLeft, frameTop), Offset(frameLeft + cornerLength, frameTop)),
                    Pair(Offset(frameLeft, frameTop), Offset(frameLeft, frameTop + cornerLength)),
                    // Top-right
                    Pair(Offset(frameLeft + frameWidth, frameTop), Offset(frameLeft + frameWidth - cornerLength, frameTop)),
                    Pair(Offset(frameLeft + frameWidth, frameTop), Offset(frameLeft + frameWidth, frameTop + cornerLength)),
                    // Bottom-left
                    Pair(Offset(frameLeft, frameTop + frameHeight), Offset(frameLeft + cornerLength, frameTop + frameHeight)),
                    Pair(Offset(frameLeft, frameTop + frameHeight), Offset(frameLeft, frameTop + frameHeight - cornerLength)),
                    // Bottom-right
                    Pair(Offset(frameLeft + frameWidth, frameTop + frameHeight), Offset(frameLeft + frameWidth - cornerLength, frameTop + frameHeight)),
                    Pair(Offset(frameLeft + frameWidth, frameTop + frameHeight), Offset(frameLeft + frameWidth, frameTop + frameHeight - cornerLength))
                )

                corners.forEach { (start, end) ->
                    drawLine(
                        color = Color.Green,
                        start = start,
                        end = end,
                        strokeWidth = 8f
                    )
                }
            }

            // Bottom card with scan result
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            ) {
                if (lastScannedBarcode != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = lastScannedBarcode!!.second,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = lastScannedBarcode!!.first,
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    onScan(lastScannedBarcode!!.first, lastScannedBarcode!!.second)
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Use This Code")
                            }
                        }
                    }
                } else {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
                        )
                    ) {
                        Text(
                            text = "Position barcode within frame",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CameraPreview(
    modifier: Modifier = Modifier,
    onBarcodeScanned: (String, String) -> Unit,
    onCameraReady: (CameraControl) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }

    val barcodeScanner = remember {
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_CODE_128,
                Barcode.FORMAT_CODE_39,
                Barcode.FORMAT_CODE_93,
                Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E,
                Barcode.FORMAT_PDF417,
                Barcode.FORMAT_AZTEC,
                Barcode.FORMAT_DATA_MATRIX,
                Barcode.FORMAT_ITF
            )
            .build()

        BarcodeScanning.getClient(options)
    }

    LaunchedEffect(Unit) {
        val cameraProvider = suspendCoroutine { continuation ->
            ProcessCameraProvider.getInstance(context).also { future ->
                future.addListener({
                    continuation.resume(future.get())
                }, ContextCompat.getMainExecutor(context))
            }
        }

        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }

        val imageAnalysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also {
                it.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
                    processImageProxy(imageProxy, barcodeScanner, onBarcodeScanned)
                }
            }

        val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

        try {
            cameraProvider.unbindAll()
            val camera = cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageAnalysis
            )

            onCameraReady(camera.cameraControl)
        } catch (exc: Exception) {
            Log.e("BarcodeScannerActivity", "Camera binding failed", exc)
        }
    }

    AndroidView(
        factory = { previewView },
        modifier = modifier
    )
}

@OptIn(ExperimentalGetImage::class)
private fun processImageProxy(
    imageProxy: ImageProxy,
    scanner: com.google.mlkit.vision.barcode.BarcodeScanner,
    onBarcodeScanned: (String, String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    barcode.rawValue?.let { value ->
                        val format = getBarcodeFormatName(barcode.format)
                        onBarcodeScanned(value, format)
                    }
                }
            }
            .addOnFailureListener { e ->
                Log.e("BarcodeScannerActivity", "Barcode scanning failed", e)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}

private fun getBarcodeFormatName(format: Int): String {
    return when (format) {
        Barcode.FORMAT_CODE_128 -> "Code 128"
        Barcode.FORMAT_CODE_39 -> "Code 39"
        Barcode.FORMAT_CODE_93 -> "Code 93"
        Barcode.FORMAT_CODABAR -> "Codabar"
        Barcode.FORMAT_DATA_MATRIX -> "Data Matrix"
        Barcode.FORMAT_EAN_13 -> "EAN-13"
        Barcode.FORMAT_EAN_8 -> "EAN-8"
        Barcode.FORMAT_ITF -> "ITF"
        Barcode.FORMAT_QR_CODE -> "QR Code"
        Barcode.FORMAT_UPC_A -> "UPC-A"
        Barcode.FORMAT_UPC_E -> "UPC-E"
        Barcode.FORMAT_PDF417 -> "PDF417"
        Barcode.FORMAT_AZTEC -> "Aztec"
        else -> "Unknown"
    }
}

// VIN Validation Extension
fun validateVIN(vin: String): Boolean {
    if (vin.length != 17) return false

    val vinPattern = Regex("^[A-HJ-NPR-Z0-9]{17}$")
    if (!vinPattern.matches(vin)) return false

    return validateVINCheckDigit(vin)
}

private fun validateVINCheckDigit(vin: String): Boolean {
    val transliteration = mapOf(
        'A' to 1, 'B' to 2, 'C' to 3, 'D' to 4, 'E' to 5, 'F' to 6, 'G' to 7, 'H' to 8,
        'J' to 1, 'K' to 2, 'L' to 3, 'M' to 4, 'N' to 5, 'P' to 7, 'R' to 9,
        'S' to 2, 'T' to 3, 'U' to 4, 'V' to 5, 'W' to 6, 'X' to 7, 'Y' to 8, 'Z' to 9
    )

    val weights = listOf(8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2)
    var sum = 0

    vin.forEachIndexed { index, char ->
        val value = if (char.isDigit()) {
            char.digitToInt()
        } else {
            transliteration[char] ?: return false
        }

        sum += value * weights[index]
    }

    val checkDigit = sum % 11
    val checkChar = vin[8]

    return if (checkDigit == 10) {
        checkChar == 'X'
    } else {
        checkChar.digitToInt() == checkDigit
    }
}
