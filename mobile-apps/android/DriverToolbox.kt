/**
 * DriverToolbox.kt
 * Fleet Manager - Digital Driver Toolbox for Android
 *
 * Comprehensive driver dashboard with inspections, reports, HOS, and more
 */

package com.fleet.manager.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fleet.manager.storage.*
import java.text.SimpleDateFormat
import java.util.*

// MARK: - Main Activity

class DriverToolboxActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                DriverToolboxScreen()
            }
        }
    }
}

// MARK: - Main Screen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DriverToolboxScreen(viewModel: DriverToolboxViewModel = viewModel()) {
    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Driver Toolbox") },
                actions = {
                    SyncIndicator(isSyncing = viewModel.isSyncing, isOnline = viewModel.isOnline)
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Inspection") },
                    label = { Text("Inspection") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Description, contentDescription = "Reports") },
                    label = { Text("Reports") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.AccessTime, contentDescription = "HOS") },
                    label = { Text("HOS") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Folder, contentDescription = "Docs") },
                    label = { Text("Docs") }
                )
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues)) {
            DriverHeader(viewModel = viewModel)

            when (selectedTab) {
                0 -> InspectionTab(viewModel = viewModel)
                1 -> ReportsTab(viewModel = viewModel)
                2 -> HOSTab(viewModel = viewModel)
                3 -> DocsTab(viewModel = viewModel)
                4 -> SettingsTab(viewModel = viewModel)
            }
        }
    }

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }
}

// MARK: - Driver Header

@Composable
fun DriverHeader(viewModel: DriverToolboxViewModel) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(viewModel.driverName, style = MaterialTheme.typography.titleMedium)
                    Text(viewModel.vehicleInfo, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .padding(end = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Surface(
                                shape = MaterialTheme.shapes.small,
                                color = if (viewModel.isOnDuty) Color.Green else Color.Gray
                            ) {}
                        }
                        Text(
                            if (viewModel.isOnDuty) "On Duty" else "Off Duty",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Text(viewModel.hosRemaining, style = MaterialTheme.typography.bodySmall, color = Color(0xFFFF9800))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatCard("Today's Miles", viewModel.todaysMiles)
                StatCard("Pending Sync", viewModel.pendingSyncCount.toString())
                StatCard("Last Inspection", viewModel.lastInspection)
            }
        }
    }
}

@Composable
fun StatCard(title: String, value: String) {
    Card(
        modifier = Modifier.padding(4.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, style = MaterialTheme.typography.titleMedium)
            Text(title, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        }
    }
}

// MARK: - Inspection Tab

@Composable
fun InspectionTab(viewModel: DriverToolboxViewModel) {
    var showInspectionDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            QuickActionButton(Icons.Default.CheckCircle, "Pre-Trip", Color.Green) {
                viewModel.startInspection("pre-trip")
                showInspectionDialog = true
            }
            QuickActionButton(Icons.Default.NightlightRound, "Post-Trip", Color(0xFFFF9800)) {
                viewModel.startInspection("post-trip")
                showInspectionDialog = true
            }
            QuickActionButton(Icons.Default.CalendarMonth, "Daily", Color.Blue) {
                viewModel.startInspection("daily")
                showInspectionDialog = true
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Recent Inspections", style = MaterialTheme.typography.titleMedium)

        LazyColumn {
            items(viewModel.recentInspections) { inspection ->
                InspectionRow(inspection)
            }
        }
    }

    if (showInspectionDialog) {
        InspectionDialog(
            viewModel = viewModel,
            onDismiss = { showInspectionDialog = false }
        )
    }
}

@Composable
fun QuickActionButton(icon: ImageVector, title: String, color: Color, onClick: () -> Unit) {
    Card(
        modifier = Modifier.padding(4.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(title, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
fun InspectionRow(inspection: InspectionItemData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(inspection.type.capitalize(), style = MaterialTheme.typography.bodyMedium)
                Text(
                    SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()).format(inspection.timestamp),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }

            Icon(
                when (inspection.syncStatus) {
                    SyncStatus.SYNCED -> Icons.Default.CheckCircle
                    SyncStatus.PENDING -> Icons.Default.Sync
                    else -> Icons.Default.Error
                },
                contentDescription = "Status",
                tint = when (inspection.syncStatus) {
                    SyncStatus.SYNCED -> Color.Green
                    SyncStatus.PENDING -> Color(0xFFFF9800)
                    else -> Color.Red
                }
            )
        }
    }
}

@Composable
fun InspectionDialog(viewModel: DriverToolboxViewModel, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Vehicle Inspection") },
        text = {
            Column {
                Text("Checklist:")
                viewModel.checklistItems.forEachIndexed { index, item ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(item)
                        Checkbox(
                            checked = viewModel.checklistStatus[index],
                            onCheckedChange = { viewModel.checklistStatus[index] = it }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                viewModel.submitInspection()
                onDismiss()
            }) {
                Text("Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

// MARK: - Reports Tab

@Composable
fun ReportsTab(viewModel: DriverToolboxViewModel) {
    Column(modifier = Modifier.padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            ReportButton(Icons.Default.LocalGasStation, "Fuel", Color.Blue) {
                viewModel.startReport("fuel")
            }
            ReportButton(Icons.Default.AttachMoney, "Expense", Color.Green) {
                viewModel.startReport("expense")
            }
            ReportButton(Icons.Default.Build, "Maintenance", Color(0xFFFF9800)) {
                viewModel.startReport("maintenance")
            }
            ReportButton(Icons.Default.Warning, "Incident", Color.Red) {
                viewModel.startReport("incident")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Recent Reports", style = MaterialTheme.typography.titleMedium)

        LazyColumn {
            items(viewModel.recentReports) { report ->
                ReportRow(report)
            }
        }
    }
}

@Composable
fun ReportButton(icon: ImageVector, title: String, color: Color, onClick: () -> Unit) {
    Card(
        modifier = Modifier.padding(4.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(24.dp))
            Text(title, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
fun ReportRow(report: ReportItemData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(report.type.capitalize(), style = MaterialTheme.typography.bodyMedium)
                report.amount?.let {
                    Text("$${"%.2f".format(it)}", style = MaterialTheme.typography.bodySmall, color = Color.Green)
                }
                Text(
                    SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(report.timestamp),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }

            if (report.syncStatus == SyncStatus.PENDING) {
                Icon(Icons.Default.Sync, contentDescription = "Pending", tint = Color(0xFFFF9800))
            }
        }
    }
}

// MARK: - HOS Tab

@Composable
fun HOSTab(viewModel: DriverToolboxViewModel) {
    Column(modifier = Modifier.padding(16.dp)) {
        HOSStatusCard("Drive Time Remaining", viewModel.driveTimeRemaining, Color.Blue)
        HOSStatusCard("On-Duty Remaining", viewModel.onDutyRemaining, Color.Green)
        HOSStatusCard("Cycle Remaining", viewModel.cycleRemaining, Color(0xFFFF9800))

        Spacer(modifier = Modifier.height(16.dp))

        Text("Change Status", style = MaterialTheme.typography.titleMedium)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            DutyStatusButton("Off Duty", Icons.Default.BedtimeOff, viewModel.currentStatus == "off") {
                viewModel.changeDutyStatus("off")
            }
            DutyStatusButton("Sleeper", Icons.Default.NightlightRound, viewModel.currentStatus == "sleeper") {
                viewModel.changeDutyStatus("sleeper")
            }
            DutyStatusButton("Driving", Icons.Default.DirectionsCar, viewModel.currentStatus == "driving") {
                viewModel.changeDutyStatus("driving")
            }
            DutyStatusButton("On Duty", Icons.Default.Person, viewModel.currentStatus == "on") {
                viewModel.changeDutyStatus("on")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Today's Log", style = MaterialTheme.typography.titleMedium)

        LazyColumn {
            items(viewModel.hosLogs) { log ->
                HOSLogRow(log)
            }
        }
    }
}

@Composable
fun HOSStatusCard(title: String, value: String, color: Color) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(title, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                Text(value, style = MaterialTheme.typography.titleMedium, color = color)
            }
        }
    }
}

@Composable
fun DutyStatusButton(status: String, icon: ImageVector, isActive: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier.padding(4.dp),
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = status,
                tint = if (isActive) Color.White else Color.Gray
            )
            Text(status, style = MaterialTheme.typography.bodySmall, color = if (isActive) Color.White else Color.Gray)
        }
    }
}

@Composable
fun HOSLogRow(log: HOSLogItemData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row {
                Icon(log.icon, contentDescription = log.status, tint = log.color)
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(log.status, style = MaterialTheme.typography.bodyMedium)
                    Text(
                        SimpleDateFormat("HH:mm", Locale.getDefault()).format(log.timestamp),
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
            Text(log.duration, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        }
    }
}

// MARK: - Docs Tab

@Composable
fun DocsTab(viewModel: DriverToolboxViewModel) {
    LazyColumn(modifier = Modifier.padding(16.dp)) {
        item {
            Text("Vehicle Documents", style = MaterialTheme.typography.titleMedium)
        }

        items(viewModel.vehicleDocs) { doc ->
            DocumentRow(doc)
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
            Text("Driver Documents", style = MaterialTheme.typography.titleMedium)
        }

        items(viewModel.driverDocs) { doc ->
            DocumentRow(doc)
        }
    }
}

@Composable
fun DocumentRow(document: DocumentItemData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(document.icon, contentDescription = document.title, tint = document.color)
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(document.title, style = MaterialTheme.typography.bodyMedium)
                document.expiryDate?.let {
                    Text(
                        "Expires: ${SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(it)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (document.isExpiringSoon) Color.Red else Color.Gray
                    )
                }
            }
            Icon(Icons.Default.ChevronRight, contentDescription = "View", tint = Color.Gray)
        }
    }
}

// MARK: - Settings Tab

@Composable
fun SettingsTab(viewModel: DriverToolboxViewModel) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Sync", style = MaterialTheme.typography.titleMedium)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Auto Sync")
            Switch(
                checked = viewModel.autoSyncEnabled,
                onCheckedChange = { viewModel.autoSyncEnabled = it }
            )
        }

        Button(
            onClick = { viewModel.forceSyncNow() },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Sync Now")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Offline Storage", style = MaterialTheme.typography.titleMedium)

        viewModel.storageStats.forEach { (key, value) ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(key)
                Text(value, color = Color.Gray)
            }
        }

        Button(
            onClick = { viewModel.clearOfflineData() },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
        ) {
            Text("Clear Offline Data")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("About", style = MaterialTheme.typography.titleMedium)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Version")
            Text("1.0.0", color = Color.Gray)
        }
    }
}

// MARK: - Sync Indicator

@Composable
fun SyncIndicator(isSyncing: Boolean, isOnline: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (isSyncing) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp))
        } else {
            Box(
                modifier = Modifier.size(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = if (isOnline) Color.Green else Color.Gray
                ) {}
            }
        }
    }
}

// MARK: - View Model

class DriverToolboxViewModel : ViewModel() {
    private lateinit var storage: OfflineStorageManager
    private lateinit var syncService: SyncService

    var driverName by mutableStateOf("John Driver")
    var vehicleInfo by mutableStateOf("Truck #1234")
    var isOnDuty by mutableStateOf(true)
    var hosRemaining by mutableStateOf("8h 30m")
    var todaysMiles by mutableStateOf("245")
    var pendingSyncCount by mutableStateOf(0)
    var lastInspection by mutableStateOf("2h ago")

    var recentInspections by mutableStateOf(listOf<InspectionItemData>())
    var recentReports by mutableStateOf(listOf<ReportItemData>())
    var hosLogs by mutableStateOf(listOf<HOSLogItemData>())
    var vehicleDocs by mutableStateOf(listOf<DocumentItemData>())
    var driverDocs by mutableStateOf(listOf<DocumentItemData>())

    var checklistItems = listOf("Tires", "Lights", "Brakes", "Fluid Levels", "Mirrors", "Horn")
    var checklistStatus = mutableStateListOf(false, false, false, false, false, false)

    var driveTimeRemaining by mutableStateOf("8h 15m")
    var onDutyRemaining by mutableStateOf("10h 45m")
    var cycleRemaining by mutableStateOf("45h 30m")
    var currentStatus by mutableStateOf("driving")

    var autoSyncEnabled by mutableStateOf(true)
    var storageStats by mutableStateOf(mapOf<String, String>())
    var isSyncing by mutableStateOf(false)
    var isOnline by mutableStateOf(true)

    fun loadData() {
        // Load data from storage
    }

    fun startInspection(type: String) {
        checklistStatus.fill(false)
    }

    fun submitInspection() {
        // Save inspection to storage
    }

    fun startReport(type: String) {
        // Show report form
    }

    fun changeDutyStatus(status: String) {
        currentStatus = status
        isOnDuty = status == "driving" || status == "on"
    }

    fun forceSyncNow() {
        isSyncing = true
        // Trigger sync
    }

    fun clearOfflineData() {
        // Clear storage
    }
}

// MARK: - Data Models

data class InspectionItemData(
    val id: String,
    val type: String,
    val timestamp: Date,
    val syncStatus: SyncStatus
)

data class ReportItemData(
    val id: String,
    val type: String,
    val timestamp: Date,
    val amount: Double?,
    val syncStatus: SyncStatus
)

data class HOSLogItemData(
    val id: String,
    val status: String,
    val timestamp: Date,
    val duration: String,
    val icon: ImageVector,
    val color: Color
)

data class DocumentItemData(
    val id: String,
    val title: String,
    val expiryDate: Date?,
    val icon: ImageVector,
    val color: Color
) {
    val isExpiringSoon: Boolean
        get() = expiryDate?.let { it.time - System.currentTimeMillis() < 2592000000 } ?: false
}
