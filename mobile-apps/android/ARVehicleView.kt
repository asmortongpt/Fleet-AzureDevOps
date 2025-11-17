/**
 * ARVehicleView.kt
 * Fleet Management - Android
 *
 * High-fidelity AR vehicle viewer using ARCore and Sceneform
 * Supports Android API 24+ with AR capabilities
 */

package com.fleet.ar

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.MotionEvent
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.ar.core.*
import com.google.ar.core.exceptions.*
import com.google.ar.sceneform.AnchorNode
import com.google.ar.sceneform.ArSceneView
import com.google.ar.sceneform.Node
import com.google.ar.sceneform.rendering.ModelRenderable
import com.google.ar.sceneform.rendering.Renderable
import com.google.ar.sceneform.ux.ArFragment
import com.google.ar.sceneform.ux.TransformableNode
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

/**
 * AR Vehicle Viewer Activity
 */
class ARVehicleViewActivity : AppCompatActivity() {

    private lateinit var arFragment: ArFragment
    private var vehicleRenderable: ModelRenderable? = null
    private var vehicleNode: TransformableNode? = null

    // Session tracking
    private var vehicleId: Int = 0
    private var modelUrl: String = ""
    private var sessionId: Int = 0
    private var placementAttempts = 0
    private var successfulPlacements = 0
    private var screenshotsTaken = 0
    private val apiClient = APIClient()

    // UI elements
    private var instructionText: TextView? = null
    private var quickLookButton: Button? = null
    private var resetButton: Button? = null
    private var screenshotButton: Button? = null
    private var scaleButton: Button? = null

    private var currentScale = 1.0f

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ar_vehicle_view)

        // Get vehicle data from intent
        vehicleId = intent.getIntExtra("VEHICLE_ID", 0)
        modelUrl = intent.getStringExtra("MODEL_URL") ?: ""

        if (vehicleId == 0 || modelUrl.isEmpty()) {
            Toast.makeText(this, "Invalid vehicle data", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Check AR availability
        if (!checkARAvailability()) {
            Toast.makeText(this, "ARCore not available", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupViews()
        loadModel()
        trackARSession()
    }

    private fun setupViews() {
        arFragment = supportFragmentManager.findFragmentById(R.id.ar_fragment) as ArFragment

        instructionText = findViewById(R.id.instruction_text)
        quickLookButton = findViewById(R.id.quick_look_button)
        resetButton = findViewById(R.id.reset_button)
        screenshotButton = findViewById(R.id.screenshot_button)
        scaleButton = findViewById(R.id.scale_button)

        // Set up AR tap listener
        arFragment.setOnTapArPlaneListener { hitResult, plane, motionEvent ->
            if (vehicleRenderable != null) {
                placeVehicle(hitResult)
            }
        }

        // Button listeners
        quickLookButton?.setOnClickListener {
            openSceneViewer()
        }

        resetButton?.setOnClickListener {
            resetAR()
        }

        screenshotButton?.setOnClickListener {
            takeScreenshot()
        }

        scaleButton?.setOnClickListener {
            toggleScale()
        }
    }

    private fun checkARAvailability(): Boolean {
        val availability = ArCoreApk.getInstance().checkAvailability(this)
        return availability.isSupported
    }

    private fun loadModel() {
        ModelRenderable.builder()
            .setSource(this, Uri.parse(modelUrl))
            .setIsFilamentGltf(true)
            .build()
            .thenAccept { renderable ->
                vehicleRenderable = renderable
                instructionText?.text = "Tap on a surface to place vehicle"
            }
            .exceptionally { throwable ->
                Toast.makeText(this, "Failed to load model: ${throwable.message}",
                    Toast.LENGTH_SHORT).show()
                null
            }
    }

    private fun placeVehicle(hitResult: HitResult) {
        placementAttempts++

        try {
            // Create anchor
            val anchor = hitResult.createAnchor()
            val anchorNode = AnchorNode(anchor)
            anchorNode.setParent(arFragment.arSceneView.scene)

            // Create transformable node
            val transformableNode = TransformableNode(arFragment.transformationSystem)
            transformableNode.setParent(anchorNode)
            transformableNode.renderable = vehicleRenderable
            transformableNode.select()

            // Apply scale
            transformableNode.localScale = Vector3(currentScale, currentScale, currentScale)

            vehicleNode = transformableNode
            successfulPlacements++

            instructionText?.text = "Placements: $successfulPlacements/$placementAttempts"
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to place vehicle", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openSceneViewer() {
        try {
            // Use Google Scene Viewer for AR
            val sceneViewerIntent = Intent(Intent.ACTION_VIEW)
            val intentUri = "https://arvr.google.com/scene-viewer/1.0" +
                    "?file=$modelUrl" +
                    "&mode=ar_only" +
                    "&title=Vehicle%20AR%20View"

            sceneViewerIntent.data = Uri.parse(intentUri)
            sceneViewerIntent.setPackage("com.google.ar.core")

            startActivity(sceneViewerIntent)
        } catch (e: Exception) {
            Toast.makeText(this, "Scene Viewer not available", Toast.LENGTH_SHORT).show()
        }
    }

    private fun resetAR() {
        // Remove existing nodes
        vehicleNode?.setParent(null)
        vehicleNode = null

        // Reset counters
        placementAttempts = 0
        successfulPlacements = 0
        instructionText?.text = "Tap on a surface to place vehicle"

        // Reset AR session
        arFragment.arSceneView.session?.let { session ->
            session.pause()
            val config = session.config
            session.resume(config)
        }
    }

    private fun takeScreenshot() {
        screenshotsTaken++

        val view = arFragment.arSceneView
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)

        PixelCopy.request(view, bitmap, { result ->
            if (result == PixelCopy.SUCCESS) {
                // Save bitmap to gallery
                saveScreenshot(bitmap)
                Toast.makeText(this, "Screenshot saved", Toast.LENGTH_SHORT).show()
            }
        }, Handler(Looper.getMainLooper()))
    }

    private fun saveScreenshot(bitmap: Bitmap) {
        val filename = "vehicle_${vehicleId}_${System.currentTimeMillis()}.png"
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, filename)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
        }

        val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)

        uri?.let {
            contentResolver.openOutputStream(it)?.use { outputStream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            }
        }
    }

    private fun toggleScale() {
        // Cycle through scales: 1.0 -> 0.5 -> 2.0 -> 1.0
        currentScale = when (currentScale) {
            1.0f -> 0.5f
            0.5f -> 2.0f
            else -> 1.0f
        }

        vehicleNode?.localScale = Vector3(currentScale, currentScale, currentScale)
        Toast.makeText(this, "Scale: ${currentScale}x", Toast.LENGTH_SHORT).show()
    }

    private fun trackARSession() {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val sessionData = JSONObject().apply {
                    put("platform", "Android")
                    put("arFramework", "ARCore")
                    put("deviceModel", Build.MODEL)
                    put("osVersion", Build.VERSION.RELEASE)
                }

                sessionId = apiClient.trackARSession(vehicleId, sessionData)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun endARSession() {
        if (sessionId == 0) return

        GlobalScope.launch(Dispatchers.IO) {
            try {
                val updates = JSONObject().apply {
                    put("placementAttempts", placementAttempts)
                    put("successfulPlacements", successfulPlacements)
                    put("screenshotsTaken", screenshotsTaken)
                }

                apiClient.endARSession(sessionId, updates)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        endARSession()
    }

    override fun onPause() {
        super.onPause()
        arFragment.arSceneView.pause()
    }

    override fun onResume() {
        super.onResume()
        arFragment.arSceneView.resume()
    }
}

/**
 * API Client for tracking AR sessions
 */
class APIClient {
    private val client = OkHttpClient()
    private val baseUrl = "https://api.fleet.com" // Configure your API base URL
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun trackARSession(vehicleId: Int, data: JSONObject): Int = withContext(Dispatchers.IO) {
        val url = "$baseUrl/api/vehicles/$vehicleId/ar-session"

        val requestBody = data.toString().toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")

            val responseBody = response.body?.string() ?: "{}"
            val json = JSONObject(responseBody)
            json.getInt("sessionId")
        }
    }

    suspend fun endARSession(sessionId: Int, updates: JSONObject) = withContext(Dispatchers.IO) {
        val url = "$baseUrl/api/ar-sessions/$sessionId"

        val requestBody = updates.toString().toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url(url)
            .put(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")
        }
    }
}

/**
 * Layout XML (activity_ar_vehicle_view.xml)
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <androidx.constraintlayout.widget.ConstraintLayout
 *     xmlns:android="http://schemas.android.com/apk/res/android"
 *     xmlns:app="http://schemas.android.com/apk/res-auto"
 *     android:layout_width="match_parent"
 *     android:layout_height="match_parent">
 *
 *     <fragment
 *         android:id="@+id/ar_fragment"
 *         android:name="com.google.ar.sceneform.ux.ArFragment"
 *         android:layout_width="match_parent"
 *         android:layout_height="match_parent" />
 *
 *     <TextView
 *         android:id="@+id/instruction_text"
 *         android:layout_width="wrap_content"
 *         android:layout_height="wrap_content"
 *         android:text="Loading model..."
 *         android:textColor="@android:color/white"
 *         android:background="#80000000"
 *         android:padding="16dp"
 *         android:textSize="16sp"
 *         app:layout_constraintTop_toTopOf="parent"
 *         app:layout_constraintStart_toStartOf="parent"
 *         app:layout_constraintEnd_toEndOf="parent"
 *         android:layout_marginTop="32dp" />
 *
 *     <LinearLayout
 *         android:layout_width="match_parent"
 *         android:layout_height="wrap_content"
 *         android:orientation="horizontal"
 *         android:gravity="center"
 *         android:padding="16dp"
 *         app:layout_constraintBottom_toBottomOf="parent">
 *
 *         <Button
 *             android:id="@+id/quick_look_button"
 *             android:layout_width="wrap_content"
 *             android:layout_height="wrap_content"
 *             android:text="Scene Viewer"
 *             android:layout_margin="8dp" />
 *
 *         <Button
 *             android:id="@+id/reset_button"
 *             android:layout_width="wrap_content"
 *             android:layout_height="wrap_content"
 *             android:text="Reset"
 *             android:layout_margin="8dp" />
 *
 *         <Button
 *             android:id="@+id/screenshot_button"
 *             android:layout_width="wrap_content"
 *             android:layout_height="wrap_content"
 *             android:text="Screenshot"
 *             android:layout_margin="8dp" />
 *
 *         <Button
 *             android:id="@+id/scale_button"
 *             android:layout_width="wrap_content"
 *             android:layout_height="wrap_content"
 *             android:text="Scale"
 *             android:layout_margin="8dp" />
 *     </LinearLayout>
 * </androidx.constraintlayout.widget.ConstraintLayout>
 */

/**
 * AndroidManifest.xml additions:
 *
 * <uses-permission android:name="android.permission.CAMERA" />
 * <uses-permission android:name="android.permission.INTERNET" />
 * <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
 *
 * <uses-feature android:name="android.hardware.camera.ar" android:required="true" />
 * <uses-feature android:glEsVersion="0x00030000" android:required="true" />
 *
 * <application>
 *     <meta-data
 *         android:name="com.google.ar.core"
 *         android:value="required" />
 *
 *     <activity
 *         android:name=".ARVehicleViewActivity"
 *         android:screenOrientation="portrait"
 *         android:theme="@style/Theme.AppCompat.NoActionBar" />
 * </application>
 */

/**
 * build.gradle dependencies:
 *
 * dependencies {
 *     implementation 'com.google.ar:core:1.37.0'
 *     implementation 'com.google.ar.sceneform.ux:sceneform-ux:1.17.1'
 *     implementation 'com.squareup.okhttp3:okhttp:4.11.0'
 *     implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1'
 * }
 */

/**
 * Usage Example:
 *
 * val intent = Intent(this, ARVehicleViewActivity::class.java)
 * intent.putExtra("VEHICLE_ID", 123)
 * intent.putExtra("MODEL_URL", "https://storage.azure.com/models/vehicle-123.glb")
 * startActivity(intent)
 */
