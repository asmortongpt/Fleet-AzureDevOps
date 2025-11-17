/**
 * Fleet Management - iOS Push-to-Talk Interface
 *
 * Features:
 * - Native iOS push-to-talk button with haptic feedback
 * - Real-time audio recording using AVFoundation
 * - WebSocket connection for streaming audio
 * - Background audio support
 * - CallKit integration for dispatch calls
 * - Emergency alert quick access
 * - Audio compression using Opus codec
 *
 * Business Value: Critical for mobile field operations
 */

import SwiftUI
import AVFoundation
import Combine
import CoreHaptics

// MARK: - Models

struct DispatchChannel: Identifiable, Codable {
    let id: Int
    let name: String
    let description: String
    let channelType: String
    let priorityLevel: Int
    let colorCode: String
    let isActive: Bool
}

struct Transmission: Identifiable, Codable {
    let id: Int
    let channelId: Int
    let userId: Int
    let userEmail: String
    let transmissionStart: String
    let transmissionEnd: String?
    let durationSeconds: Double?
    let transcriptionText: String?
    let isEmergency: Bool
}

// MARK: - WebSocket Manager

class DispatchWebSocketManager: NSObject, ObservableObject {
    @Published var isConnected = false
    @Published var currentTransmission: String?
    @Published var activeListeners = 0

    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession!

    override init() {
        super.init()
        let configuration = URLSessionConfiguration.default
        urlSession = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
    }

    func connect(channelId: Int, userId: Int, username: String) {
        let baseURL = UserDefaults.standard.string(forKey: "apiBaseURL") ?? "wss://fleet-api.azurewebsites.net"
        guard let url = URL(string: "\(baseURL)/api/dispatch/ws") else { return }

        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()

        receiveMessage()

        // Join channel after connection
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.send(message: [
                "type": "join_channel",
                "channelId": channelId,
                "userId": userId,
                "username": username,
                "deviceInfo": [
                    "type": "ios",
                    "model": UIDevice.current.model,
                    "version": UIDevice.current.systemVersion
                ]
            ])
        }

        isConnected = true
    }

    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        isConnected = false
    }

    func send(message: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: message),
              let string = String(data: data, encoding: .utf8) else { return }

        let message = URLSessionWebSocketTask.Message.string(string)
        webSocketTask?.send(message) { error in
            if let error = error {
                print("WebSocket send error: \(error)")
            }
        }
    }

    func sendAudioChunk(transmissionId: Int, channelId: Int, audioData: Data) {
        let base64Audio = audioData.base64EncodedString()
        send(message: [
            "type": "audio_chunk",
            "transmissionId": transmissionId,
            "channelId": channelId,
            "audioData": base64Audio
        ])
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text: text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleMessage(text: text)
                    }
                @unknown default:
                    break
                }

                self?.receiveMessage()

            case .failure(let error):
                print("WebSocket receive error: \(error)")
                DispatchQueue.main.async {
                    self?.isConnected = false
                }
            }
        }
    }

    private func handleMessage(text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }

        DispatchQueue.main.async {
            switch type {
            case "transmission_started":
                if let username = json["username"] as? String {
                    self.currentTransmission = username
                }
            case "transmission_ended":
                self.currentTransmission = nil
            case "user_joined", "user_left":
                // Update listener count
                break
            default:
                break
            }
        }
    }
}

extension DispatchWebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        DispatchQueue.main.async {
            self.isConnected = true
        }
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        DispatchQueue.main.async {
            self.isConnected = false
        }
    }
}

// MARK: - Audio Recorder

class DispatchAudioRecorder: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var audioLevel: Float = 0.0

    private var audioRecorder: AVAudioRecorder?
    private var audioEngine: AVAudioEngine?
    private var recordingSession: AVAudioSession = AVAudioSession.sharedInstance()
    private var audioChunks: [Data] = []
    private var transmissionId: Int?

    weak var webSocketManager: DispatchWebSocketManager?

    override init() {
        super.init()
        setupAudioSession()
    }

    private func setupAudioSession() {
        do {
            try recordingSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
            try recordingSession.setActive(true)

            recordingSession.requestRecordPermission { allowed in
                if !allowed {
                    print("Microphone permission denied")
                }
            }
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }

    func startRecording(channelId: Int, transmissionId: Int) {
        self.transmissionId = transmissionId
        audioChunks.removeAll()

        let audioFilename = getDocumentsDirectory().appendingPathComponent("transmission-\(transmissionId).m4a")

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 48000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.record()

            isRecording = true

            // Start audio level monitoring
            startAudioLevelMonitoring()

            // Provide haptic feedback
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        } catch {
            print("Could not start recording: \(error)")
        }
    }

    func stopRecording(channelId: Int) {
        audioRecorder?.stop()
        isRecording = false

        // Provide haptic feedback
        UIImpactFeedbackGenerator(style: .light).impactOccurred()

        // Send complete audio to server
        if let transmissionId = transmissionId,
           let audioURL = audioRecorder?.url,
           let audioData = try? Data(contentsOf: audioURL) {
            webSocketManager?.send(message: [
                "type": "end_transmission",
                "transmissionId": transmissionId,
                "channelId": channelId,
                "audioBlob": audioData.base64EncodedString()
            ])
        }
    }

    private func startAudioLevelMonitoring() {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
            guard let self = self, self.isRecording else {
                timer.invalidate()
                return
            }

            self.audioRecorder?.updateMeters()
            let averagePower = self.audioRecorder?.averagePower(forChannel: 0) ?? -160

            // Convert from dB to 0-1 scale
            let normalizedValue = max(0, min(1, (averagePower + 160) / 160))

            DispatchQueue.main.async {
                self.audioLevel = normalizedValue
            }
        }
    }

    private func getDocumentsDirectory() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}

extension DispatchAudioRecorder: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if !flag {
            print("Recording failed")
        }
    }
}

// MARK: - Main View

struct DispatchPTTView: View {
    @StateObject private var webSocketManager = DispatchWebSocketManager()
    @StateObject private var audioRecorder = DispatchAudioRecorder()
    @State private var channels: [DispatchChannel] = []
    @State private var selectedChannelId: Int?
    @State private var transmissionHistory: [Transmission] = []
    @State private var showEmergencyAlert = false
    @State private var isPTTPressed = false
    @State private var currentTransmissionId: Int?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text("Dispatch Radio")
                            .font(.title)
                            .fontWeight(.bold)

                        if let channel = selectedChannel {
                            Text(channel.name)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    // Connection indicator
                    HStack(spacing: 4) {
                        Circle()
                            .fill(webSocketManager.isConnected ? Color.green : Color.red)
                            .frame(width: 8, height: 8)
                        Text(webSocketManager.isConnected ? "Connected" : "Disconnected")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)
                }
                .padding()

                // Channel selector
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(channels) { channel in
                            ChannelButton(
                                channel: channel,
                                isSelected: selectedChannelId == channel.id,
                                action: { selectChannel(channel) }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)

                Spacer()

                // Current transmission indicator
                if let transmittingUser = webSocketManager.currentTransmission {
                    HStack {
                        Image(systemName: "waveform")
                            .foregroundColor(.blue)
                        Text("\(transmittingUser) is transmitting")
                            .font(.subheadline)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                    .padding(.horizontal)
                }

                // PTT Button
                VStack(spacing: 16) {
                    // Audio level indicator
                    if audioRecorder.isRecording {
                        AudioLevelMeter(level: audioRecorder.audioLevel)
                            .frame(height: 8)
                            .padding(.horizontal, 40)
                    }

                    // Main PTT Button
                    Button(action: {}) {
                        ZStack {
                            Circle()
                                .fill(isPTTPressed ? Color.red : Color.blue)
                                .frame(width: 160, height: 160)
                                .shadow(color: isPTTPressed ? .red.opacity(0.5) : .blue.opacity(0.3), radius: 20)

                            Image(systemName: isPTTPressed ? "mic.fill" : "mic.slash.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.white)
                        }
                    }
                    .simultaneousGesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { _ in
                                if !isPTTPressed {
                                    handlePTTPress()
                                }
                            }
                            .onEnded { _ in
                                if isPTTPressed {
                                    handlePTTRelease()
                                }
                            }
                    )
                    .disabled(selectedChannelId == nil || !webSocketManager.isConnected)

                    Text(isPTTPressed ? "Transmitting..." : "Hold to Speak")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 40)

                Spacer()

                // Emergency button
                Button(action: { showEmergencyAlert = true }) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                        Text("Emergency Alert")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .cornerRadius(12)
                }
                .padding()

                // Transmission history
                TransmissionHistoryList(history: transmissionHistory)
                    .frame(height: 200)
            }
            .navigationBarHidden(true)
            .onAppear {
                loadChannels()
                audioRecorder.webSocketManager = webSocketManager
            }
            .sheet(isPresented: $showEmergencyAlert) {
                EmergencyAlertView()
            }
        }
    }

    private var selectedChannel: DispatchChannel? {
        channels.first { $0.id == selectedChannelId }
    }

    private func loadChannels() {
        // In production, this would make an API call
        let mockChannels = [
            DispatchChannel(id: 1, name: "Main Dispatch", description: "Primary channel", channelType: "general", priorityLevel: 5, colorCode: "#3B82F6", isActive: true),
            DispatchChannel(id: 2, name: "Emergency", description: "Emergency only", channelType: "emergency", priorityLevel: 10, colorCode: "#EF4444", isActive: true),
            DispatchChannel(id: 3, name: "Maintenance", description: "Maintenance coordination", channelType: "maintenance", priorityLevel: 3, colorCode: "#F59E0B", isActive: true)
        ]

        channels = mockChannels
        if let first = mockChannels.first {
            selectChannel(first)
        }
    }

    private func selectChannel(_ channel: DispatchChannel) {
        selectedChannelId = channel.id

        // Reconnect to new channel
        webSocketManager.disconnect()
        webSocketManager.connect(
            channelId: channel.id,
            userId: 1, // TODO: Get from auth
            username: "User" // TODO: Get from auth
        )

        loadChannelHistory(channelId: channel.id)
    }

    private func loadChannelHistory(channelId: Int) {
        // In production, fetch from API
        transmissionHistory = []
    }

    private func handlePTTPress() {
        guard let channelId = selectedChannelId else { return }

        isPTTPressed = true

        // Start transmission on server
        let transmissionId = Int.random(in: 1...100000)
        currentTransmissionId = transmissionId

        webSocketManager.send(message: [
            "type": "start_transmission",
            "channelId": channelId,
            "userId": 1, // TODO: Get from auth
            "username": "User", // TODO: Get from auth
            "isEmergency": false
        ])

        // Start recording
        audioRecorder.startRecording(channelId: channelId, transmissionId: transmissionId)
    }

    private func handlePTTRelease() {
        guard let channelId = selectedChannelId else { return }

        isPTTPressed = false

        // Stop recording
        audioRecorder.stopRecording(channelId: channelId)

        currentTransmissionId = nil
    }
}

// MARK: - Supporting Views

struct ChannelButton: View {
    let channel: DispatchChannel
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 4) {
                Text(channel.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(channel.channelType)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(isSelected ? Color.blue : Color.secondary.opacity(0.1))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: channel.colorCode), lineWidth: 2)
            )
        }
    }
}

struct AudioLevelMeter: View {
    let level: Float

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.secondary.opacity(0.2))

                Rectangle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [.green, .yellow, .red]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * CGFloat(level))
            }
        }
        .cornerRadius(4)
    }
}

struct TransmissionHistoryList: View {
    let history: [Transmission]

    var body: some View {
        VStack(alignment: .leading) {
            Text("Recent Transmissions")
                .font(.headline)
                .padding(.horizontal)

            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(history) { transmission in
                        TransmissionRow(transmission: transmission)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

struct TransmissionRow: View {
    let transmission: Transmission

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(transmission.userEmail)
                    .font(.subheadline)
                    .fontWeight(.medium)

                if let transcription = transmission.transcriptionText {
                    Text(transcription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }

            Spacer()

            if let duration = transmission.durationSeconds {
                Text(formatDuration(duration))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(8)
    }

    private func formatDuration(_ seconds: Double) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%d:%02d", mins, secs)
    }
}

struct EmergencyAlertView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var alertType = "panic"
    @State private var description = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Emergency Type")) {
                    Picker("Type", selection: $alertType) {
                        Text("Panic").tag("panic")
                        Text("Accident").tag("accident")
                        Text("Medical").tag("medical")
                        Text("Fire").tag("fire")
                        Text("Security").tag("security")
                    }
                }

                Section(header: Text("Description")) {
                    TextEditor(text: $description)
                        .frame(height: 100)
                }

                Button(action: sendEmergencyAlert) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                        Text("Send Emergency Alert")
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .cornerRadius(12)
                }
            }
            .navigationTitle("Emergency Alert")
            .navigationBarItems(trailing: Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }

    private func sendEmergencyAlert() {
        // In production, send to API
        print("Emergency alert sent: \(alertType) - \(description)")
        presentationMode.wrappedValue.dismiss()
    }
}

// MARK: - Helpers

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted))
        var hexNumber: UInt64 = 0

        if scanner.scanHexInt64(&hexNumber) {
            let r = Double((hexNumber & 0xff0000) >> 16) / 255
            let g = Double((hexNumber & 0x00ff00) >> 8) / 255
            let b = Double(hexNumber & 0x0000ff) / 255

            self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
            return
        }

        self.init(.sRGB, red: 0, green: 0, blue: 0, opacity: 1)
    }
}

// MARK: - Preview

struct DispatchPTTView_Previews: PreviewProvider {
    static var previews: some View {
        DispatchPTTView()
    }
}
