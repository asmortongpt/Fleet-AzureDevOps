// ============================================================================
// Fleet PTT - Push-To-Talk Button Component
// ============================================================================
// Circular PTT button with press-and-hold interaction

import React, { useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import type { FloorState } from "../../Services/PTT/dispatchTypes";

export interface PushToTalkButtonProps {
  // PTT state
  floorState: FloorState;
  isTransmitting: boolean;
  currentSpeaker: string | null;
  connected: boolean;

  // Actions
  onPressIn: () => Promise<void>;
  onPressOut: () => void;

  // Customization
  size?: number;
  disabled?: boolean;
}

export function PushToTalkButton({
  floorState,
  isTransmitting,
  currentSpeaker,
  connected,
  onPressIn,
  onPressOut,
  size = 120,
  disabled = false,
}: PushToTalkButtonProps) {
  const [pressing, setPressing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Button state
  const getButtonState = (): {
    color: string;
    label: string;
    icon: string;
  } => {
    if (!connected) {
      return {
        color: "#6B7280", // gray
        label: "Offline",
        icon: "○",
      };
    }

    switch (floorState) {
      case "requesting":
        return {
          color: "#F59E0B", // amber
          label: "Requesting",
          icon: "⏳",
        };
      case "granted":
      case "transmitting":
        if (isTransmitting) {
          return {
            color: "#EF4444", // red
            label: "Talking",
            icon: "🎙",
          };
        }
        return {
          color: "#10B981", // green
          label: "Ready",
          icon: "✓",
        };
      case "denied":
        return {
          color: "#EF4444", // red
          label: "Denied",
          icon: "✗",
        };
      case "listening":
        return {
          color: "#3B82F6", // blue
          label: "Listening",
          icon: "🔊",
        };
      default:
        return {
          color: "#6B7280", // gray
          label: "Press & Hold",
          icon: "🎙",
        };
    }
  };

  const buttonState = getButtonState();

  // Handle press start
  const handlePressIn = useCallback(async () => {
    if (disabled || !connected) return;

    setPressing(true);

    // Animate press
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();

    // Request floor
    await onPressIn();
  }, [disabled, connected, onPressIn, scaleAnim]);

  // Handle press end
  const handlePressOut = useCallback(() => {
    if (disabled) return;

    setPressing(false);

    // Animate release
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    onPressOut();
  }, [disabled, onPressOut, scaleAnim]);

  // Pulse animation when transmitting
  React.useEffect(() => {
    if (isTransmitting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTransmitting, pulseAnim]);

  // Haptic feedback (iOS)
  const triggerHaptic = () => {
    if (Platform.OS === "ios") {
      // TODO: Import and use Haptics from react-native
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const isDisabled = disabled || !connected;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPressIn={() => {
          triggerHaptic();
          handlePressIn();
        }}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: buttonState.color,
              opacity: isDisabled ? 0.5 : 1,
              transform: [
                { scale: scaleAnim },
                { scale: isTransmitting ? pulseAnim : 1 },
              ],
            },
          ]}
        >
          {/* Outer ring when talking */}
          {isTransmitting && (
            <View
              style={[
                styles.outerRing,
                {
                  width: size + 20,
                  height: size + 20,
                  borderRadius: (size + 20) / 2,
                },
              ]}
            />
          )}

          {/* Icon */}
          <Text style={[styles.icon, { fontSize: size / 3 }]}>
            {buttonState.icon}
          </Text>

          {/* Label */}
          <Text style={[styles.label, { fontSize: size / 8 }]}>
            {buttonState.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Current speaker indicator */}
      {currentSpeaker && !isTransmitting && (
        <View style={styles.speakerIndicator}>
          <Text style={styles.speakerText}>
            {currentSpeaker} is talking
          </Text>
        </View>
      )}

      {/* Instructions */}
      {!isTransmitting && !currentSpeaker && connected && (
        <Text style={styles.instructions}>
          Press and hold to talk
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  outerRing: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  icon: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  speakerIndicator: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 20,
  },
  speakerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  instructions: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 14,
  },
});
