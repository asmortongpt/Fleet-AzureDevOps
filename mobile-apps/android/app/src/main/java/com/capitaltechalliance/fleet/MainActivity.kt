package com.capitaltechalliance.fleet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.capitaltechalliance.fleet.ui.navigation.FleetNavHost
import com.capitaltechalliance.fleet.ui.theme.FleetTheme
import com.capitaltechalliance.fleet.ui.auth.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint
import timber.log.Timber

/**
 * Fleet Mobile - Main Activity
 *
 * Entry point for the Fleet Management Android application.
 * Uses Jetpack Compose for the entire UI with MVVM architecture.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)

        Timber.d("MainActivity created")

        // Enable edge-to-edge display
        enableEdgeToEdge()

        setContent {
            FleetApp()
        }
    }

    override fun onResume() {
        super.onResume()
        Timber.d("MainActivity resumed")
    }

    override fun onPause() {
        super.onPause()
        Timber.d("MainActivity paused")
    }
}

@Composable
fun FleetApp() {
    FleetTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            val authViewModel: AuthViewModel = hiltViewModel()
            val authState by authViewModel.authState.collectAsStateWithLifecycle()

            FleetNavHost(
                isAuthenticated = authState.isAuthenticated
            )
        }
    }
}
