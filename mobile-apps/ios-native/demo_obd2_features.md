# DCF Fleet Management - OBD2 Features Demo

## What Happens When You Use The App:

### 1. **Initial Launch**
When you tap on "Driver Portal", the app:
- Immediately starts scanning for OBD2 devices via Bluetooth
- Shows "Scanning for OBD2 devices..." status
- Searches for ELM327 compatible devices

### 2. **After 15 Seconds (No Device Found)**
If no OBD2 device is detected:
- **Alert Appears**: "OBD2 Not Connected"
- **Message**: "Unable to connect to OBD2 device. Would you like to enter data manually or retry the connection?"
- **Options**:
  - "Enter Manually" - Switches to manual data entry mode
  - "Retry Connection" - Attempts to scan again (up to 3 times)

### 3. **OBD2 Status Banner** (Top of Driver Portal)
Shows real-time connection status:
- 🟠 **Orange Banner**: "No OBD2 devices found" with "Connect" button
- 🔵 **Blue Scanning**: Animated antenna icon when searching
- 🟢 **Green Connected**: Shows when OBD2 device is connected

### 4. **Manual Mode Fallback**
If user chooses manual entry or max retries reached:
- Status shows: "Manual Mode - No OBD2 found"
- Users can manually enter:
  - Mileage
  - Fuel level
  - Maintenance issues
  - Vehicle inspection data

### 5. **Settings Tab - OBD2 Configuration**
Full OBD2 settings page includes:
- **Connection Settings**:
  - Auto-Connect on Launch (toggle)
  - Ignore Connection Alerts (toggle)
  - Alert Frequency (Every Time/Once Per Day/Once Per Week/Never)
  
- **Device Information**:
  - Current connection status
  - Connected device name
  - Signal strength indicator
  
- **Actions**:
  - Scan for OBD2 Devices button
  - Disconnect Current Device button

### 6. **Alert Preferences**
Users can:
- Disable all future OBD2 connection alerts
- Set alert frequency preferences
- Reset alert preferences anytime

## Key Features Implemented:

✅ **Real Bluetooth Scanning** - No fake data
✅ **Early Connection Detection** - Starts immediately
✅ **Smart Alerts** - Only shows when needed
✅ **User Control** - Can disable alerts permanently
✅ **Manual Fallback** - Always have data entry option
✅ **Retry Logic** - Up to 3 automatic retries
✅ **Settings Integration** - Full configuration control

## Technical Details:

- **Supported Devices**: ELM327 compatible OBD2 adapters
- **Bluetooth UUIDs**: Standard OBD2 service UUIDs
- **Scan Duration**: 15 seconds per attempt
- **Data Sync**: Sends to Azure when connected
- **Offline Mode**: Stores data locally when no connection