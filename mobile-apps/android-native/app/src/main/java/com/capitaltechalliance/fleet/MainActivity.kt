package com.capitaltechalliance.fleet

import android.os.Bundle
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.capitaltechalliance.fleet.ui.theme.FleetManagerTheme

/**
 * Fleet Manager MainActivity
 * Native Android app with WebView wrapping the production web application
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FleetManagerTheme {
                FleetManagerApp()
            }
        }
    }
}

@Composable
fun FleetManagerApp() {
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var webView: WebView? by remember { mutableStateOf(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Native header
        FleetManagerHeader(
            isLoading = isLoading,
            error = error,
            onRetry = {
                error = null
                webView?.reload()
            }
        )

        // WebView
        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
        ) {
            when {
                error != null -> ErrorScreen(
                    error = error!!,
                    onRetry = {
                        error = null
                        webView?.reload()
                    }
                )
                else -> FleetWebView(
                    onWebViewCreated = { view ->
                        webView = view
                    },
                    onLoadingChanged = { loading ->
                        isLoading = loading
                    },
                    onError = { errorMessage ->
                        error = errorMessage
                        isLoading = false
                    }
                )
            }

            if (isLoading && error == null) {
                LoadingIndicator()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FleetManagerHeader(
    isLoading: Boolean,
    error: String?,
    onRetry: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shadowElevation = 4.dp,
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(R.drawable.ic_fleet),
                    contentDescription = "Fleet Icon",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Fleet Manager",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            // Status indicator
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(
                        color = when {
                            error != null -> Color.Red
                            isLoading -> Color(0xFFFFA500) // Orange
                            else -> Color(0xFF4CAF50) // Green
                        },
                        shape = CircleShape
                    )
            )
        }
    }
}

@Composable
fun FleetWebView(
    onWebViewCreated: (WebView) -> Unit,
    onLoadingChanged: (Boolean) -> Unit,
    onError: (String) -> Unit
) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                // WebView configuration
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    allowFileAccess = false
                    allowContentAccess = false
                    setSupportZoom(true)
                    builtInZoomControls = false
                    mediaPlaybackRequiresUserGesture = false
                }

                // Clear cache
                clearCache(true)
                clearHistory()

                // WebView client
                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                        onLoadingChanged(true)
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        onLoadingChanged(false)
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        onError(error?.description?.toString() ?: "Unknown error")
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        // Allow all fleet.capitaltechalliance.com URLs
                        val url = request?.url?.toString() ?: ""
                        return if (url.startsWith("https://fleet.capitaltechalliance.com")) {
                            false // Load in WebView
                        } else {
                            true // Block external URLs
                        }
                    }
                }

                // WebChrome client for JavaScript dialogs
                webChromeClient = WebChromeClient()

                // Load the production URL
                loadUrl(ApiConfiguration.AZURE_BASE_URL)

                onWebViewCreated(this)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

@Composable
fun LoadingIndicator() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(48.dp),
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
fun ErrorScreen(error: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Connection Error",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = error,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(32.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}
