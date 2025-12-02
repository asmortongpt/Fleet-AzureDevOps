// ============================================================================
// Fleet PTT - Push-To-Talk Button (SwiftUI)
// ============================================================================
// Circular PTT button with press-and-hold interaction

import SwiftUI

struct PushToTalkButton: View {
    // MARK: - Properties

    let floorState: FloorState
    let isTransmitting: Bool
    let currentSpeaker: String?
    let connected: Bool
    let onPressIn: () async -> Void
    let onPressOut: () -> Void
    let size: CGFloat
    let disabled: Bool

    @State private var isPressing = false
    @State private var scale: CGFloat = 1.0
    @State private var pulseScale: CGFloat = 1.0

    // MARK: - Initialization

    init(
        floorState: FloorState,
        isTransmitting: Bool,
        currentSpeaker: String? = nil,
        connected: Bool,
        onPressIn: @escaping () async -> Void,
        onPressOut: @escaping () -> Void,
        size: CGFloat = 120,
        disabled: Bool = false
    ) {
        self.floorState = floorState
        self.isTransmitting = isTransmitting
        self.currentSpeaker = currentSpeaker
        self.connected = connected
        self.onPressIn = onPressIn
        self.onPressOut = onPressOut
        self.size = size
        self.disabled = disabled
    }

    // MARK: - Button State

    private var buttonState: (color: Color, label: String, icon: String) {
        if !connected {
            return (Color.gray, "Offline", "○")
        }

        switch floorState {
        case .requesting:
            return (Color.orange, "Requesting", "⏳")
        case .granted, .transmitting:
            if isTransmitting {
                return (Color.red, "Talking", "🎙")
            }
            return (Color.green, "Ready", "✓")
        case .denied:
            return (Color.red, "Denied", "✗")
        case .listening:
            return (Color.blue, "Listening", "🔊")
        case .idle:
            return (Color.gray, "Press & Hold", "🎙")
        }
    }

    private var isDisabled: Bool {
        disabled || !connected
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 16) {
            // PTT Button
            Button(action: {}) {
                ZStack {
                    // Outer ring when transmitting
                    if isTransmitting {
                        Circle()
                            .stroke(Color.white.opacity(0.5), lineWidth: 3)
                            .frame(width: size + 20, height: size + 20)
                            .scaleEffect(pulseScale)
                    }

                    // Main button
                    Circle()
                        .fill(buttonState.color)
                        .frame(width: size, height: size)
                        .scaleEffect(scale)
                        .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 4)
                        .overlay(
                            VStack(spacing: 4) {
                                // Icon
                                Text(buttonState.icon)
                                    .font(.system(size: size / 3))
                                    .foregroundColor(.white)
                                    .fontWeight(.bold)

                                // Label
                                Text(buttonState.label)
                                    .font(.system(size: size / 8))
                                    .foregroundColor(.white)
                                    .fontWeight(.semibold)
                                    .textCase(.uppercase)
                            }
                        )
                }
            }
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        if !isPressing && !isDisabled {
                            handlePressIn()
                        }
                    }
                    .onEnded { _ in
                        if isPressing {
                            handlePressOut()
                        }
                    }
            )
            .disabled(isDisabled)
            .opacity(isDisabled ? 0.5 : 1.0)

            // Current speaker indicator
            if let speaker = currentSpeaker, !isTransmitting {
                Text("\(speaker) is talking")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.blue)
                    .cornerRadius(20)
            }

            // Instructions
            if !isTransmitting && currentSpeaker == nil && connected {
                Text("Press and hold to talk")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
        }
        .onChange(of: isTransmitting) { transmitting in
            if transmitting {
                startPulseAnimation()
            } else {
                stopPulseAnimation()
            }
        }
    }

    // MARK: - Actions

    private func handlePressIn() {
        isPressing = true

        // Animate press
        withAnimation(.spring(response: 0.3)) {
            scale = 0.9
        }

        // Trigger haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        // Request floor
        Task {
            await onPressIn()
        }
    }

    private func handlePressOut() {
        isPressing = false

        // Animate release
        withAnimation(.spring(response: 0.3)) {
            scale = 1.0
        }

        onPressOut()
    }

    private func startPulseAnimation() {
        withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
            pulseScale = 1.1
        }
    }

    private func stopPulseAnimation() {
        withAnimation(.easeInOut(duration: 0.2)) {
            pulseScale = 1.0
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 40) {
        // Idle state
        PushToTalkButton(
            floorState: .idle,
            isTransmitting: false,
            connected: true,
            onPressIn: {},
            onPressOut: {}
        )

        // Transmitting state
        PushToTalkButton(
            floorState: .transmitting,
            isTransmitting: true,
            connected: true,
            onPressIn: {},
            onPressOut: {}
        )

        // Listening state
        PushToTalkButton(
            floorState: .listening,
            isTransmitting: false,
            currentSpeaker: "Unit 23",
            connected: true,
            onPressIn: {},
            onPressOut: {}
        )
    }
    .padding()
    .background(Color(white: 0.95))
}
