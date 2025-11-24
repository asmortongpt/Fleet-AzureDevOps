// ============================================================================
// Fleet PTT - Push-To-Talk Panel Component
// ============================================================================
// Channel selector and presence roster UI

import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { PushToTalkButton } from "./PushToTalkButton";
import { useDispatchPTT } from "../../Hooks/useDispatchPTT";
import type { Channel, PresenceUser } from "../../Services/PTT/dispatchTypes";

export interface PushToTalkPanelProps {
  signalingUrl: string;
  token: string;
  platform: "web" | "native";
  defaultChannelId?: string;
}

export function PushToTalkPanel({
  signalingUrl,
  token,
  platform,
  defaultChannelId,
}: PushToTalkPanelProps) {
  const ptt = useDispatchPTT({
    signalingUrl,
    token,
    platform,
    defaultChannelId,
    autoConnect: true,
    debug: true,
  });

  // Handle PTT button press
  const handlePressIn = async () => {
    const granted = await ptt.requestFloor();
    if (granted) {
      await ptt.startTransmit();
    }
  };

  const handlePressOut = () => {
    ptt.stopTransmit();
  };

  // Render presence user
  const renderPresenceUser = ({ item }: { item: PresenceUser }) => (
    <View style={styles.userItem}>
      <View
        style={[
          styles.userStatus,
          {
            backgroundColor:
              item.status === "talking"
                ? "#EF4444"
                : item.status === "online"
                ? "#10B981"
                : "#6B7280",
          },
        ]}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName}</Text>
        {item.unit && (
          <Text style={styles.userUnit}>{item.unit}</Text>
        )}
      </View>
      {item.status === "talking" && (
        <Text style={styles.talkingIndicator}>🎙</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Push-To-Talk</Text>
        <View
          style={[
            styles.connectionStatus,
            {
              backgroundColor: ptt.connected ? "#10B981" : "#EF4444",
            },
          ]}
        />
      </View>

      {/* Channel info */}
      {ptt.currentChannel && (
        <View style={styles.channelInfo}>
          <Text style={styles.channelName}>
            Channel: {ptt.currentChannel}
          </Text>
          <Text style={styles.channelUsers}>
            {ptt.presenceUsers.length} users online
          </Text>
        </View>
      )}

      {/* PTT Button */}
      <View style={styles.buttonContainer}>
        <PushToTalkButton
          floorState={ptt.floorState}
          isTransmitting={ptt.isTransmitting}
          currentSpeaker={ptt.currentSpeaker}
          connected={ptt.connected}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          size={140}
        />
      </View>

      {/* Presence Roster */}
      {ptt.presenceUsers.length > 0 && (
        <View style={styles.presenceSection}>
          <Text style={styles.sectionTitle}>Active Users</Text>
          <FlatList
            data={ptt.presenceUsers}
            renderItem={renderPresenceUser}
            keyExtractor={(item) => item.userId}
            style={styles.presenceList}
          />
        </View>
      )}

      {/* Error display */}
      {ptt.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{ptt.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  connectionStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  channelInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  channelName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  channelUsers: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  presenceSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  presenceList: {
    flex: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
  },
  userStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  userUnit: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  talkingIndicator: {
    fontSize: 18,
  },
  errorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FEE2E2",
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
  },
  errorText: {
    fontSize: 14,
    color: "#991B1B",
  },
});
