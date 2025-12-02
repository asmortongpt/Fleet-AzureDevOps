/**
 * SMSComposer Component
 * SMS/MMS composer with character counter, template support, and photo attachments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  SMSDraft,
  SMSAttachment,
  MessagingContext,
  Contact,
} from '../types/messaging.types';
import { MessagingService } from '../services/MessagingService';
import { MessageTemplateSelector } from './MessageTemplateSelector';

interface SMSComposerProps {
  context?: MessagingContext;
  onSend?: (draft: SMSDraft) => void;
  onCancel?: () => void;
  initialDraft?: SMSDraft;
  availableContacts?: Contact[];
}

export const SMSComposer: React.FC<SMSComposerProps> = ({
  context,
  onSend,
  onCancel,
  initialDraft,
  availableContacts = [],
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialDraft?.to || '');
  const [body, setBody] = useState(initialDraft?.body || '');
  const [attachment, setAttachment] = useState<SMSAttachment | undefined>(
    initialDraft?.attachment
  );
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);

  const messagingService = new MessagingService();

  // SMS character limits
  const MAX_SMS_LENGTH = 160;
  const MAX_MMS_LENGTH = 1600;
  const maxLength = attachment ? MAX_MMS_LENGTH : MAX_SMS_LENGTH;

  useEffect(() => {
    // Pre-fill from context if available
    if (context?.prefillData) {
      if (context.prefillData.body) {
        setBody(context.prefillData.body);
      }
      if (context.prefillData.recipients && context.prefillData.recipients[0]) {
        setPhoneNumber(context.prefillData.recipients[0]);
      }
    }
  }, [context]);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleAttachPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment: SMSAttachment = {
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        };

        setAttachment(newAttachment);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const removeAttachment = () => {
    setAttachment(undefined);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const draft: SMSDraft = {
        to: phoneNumber,
        body,
        attachment,
        linkedEntityType: context?.entityType,
        linkedEntityId: context?.entityId,
        updatedAt: new Date(),
      };

      await messagingService.saveDraft('sms', draft);
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSend = async () => {
    // Validation
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (body.length > maxLength) {
      Alert.alert(
        'Error',
        `Message exceeds maximum length of ${maxLength} characters`
      );
      return;
    }

    setIsSending(true);
    try {
      const cleanedPhone = '+1' + phoneNumber.replace(/\D/g, '');
      const entityLinks = context
        ? [
            {
              entity_type: context.entityType,
              entity_id: context.entityId,
              link_type: 'Related',
            },
          ]
        : undefined;

      const response = await messagingService.sendSMS({
        to: cleanedPhone,
        body,
        mediaUrl: attachment?.uri,
        entityLinks,
      });

      if (response.success) {
        Alert.alert('Success', 'SMS sent successfully');
        if (onSend) {
          const draft: SMSDraft = {
            to: phoneNumber,
            body,
            attachment,
          };
          onSend(draft);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to send SMS');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelected = (template: any, variables: any) => {
    setBody(template.body);
    setShowTemplateSelector(false);
  };

  const handleContactSelected = (contact: Contact) => {
    if (contact.phoneNumber) {
      setPhoneNumber(contact.phoneNumber);
    }
    setShowContactPicker(false);
  };

  const getCharacterCount = () => {
    return body.length;
  };

  const getMessageCount = () => {
    if (attachment) {
      return '1 MMS';
    }
    const count = Math.ceil(body.length / 160) || 1;
    return `${count} SMS`;
  };

  const getCharacterColor = () => {
    const ratio = body.length / maxLength;
    if (ratio > 0.9) return '#FF3B30';
    if (ratio > 0.7) return '#FF9500';
    return '#666';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New SMS</Text>
          <TouchableOpacity
            onPress={handleSaveDraft}
            disabled={isSavingDraft}
            style={styles.draftButton}
          >
            {isSavingDraft ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.draftButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Context Banner */}
        {context && (
          <View style={styles.contextBanner}>
            <Text style={styles.contextText}>
              Related to: {context.entityName || context.entityType}
            </Text>
          </View>
        )}

        {/* Phone Number Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>To:</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              maxLength={14}
            />
            <TouchableOpacity
              onPress={() => setShowContactPicker(true)}
              style={styles.contactButton}
            >
              <Text style={styles.contactButtonText}>📇</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Template Button */}
        <TouchableOpacity
          onPress={() => setShowTemplateSelector(true)}
          style={styles.templateButton}
        >
          <Text style={styles.templateButtonText}>Use Template</Text>
        </TouchableOpacity>

        {/* Message Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.messageHeader}>
            <Text style={styles.fieldLabel}>Message:</Text>
            <View style={styles.counterContainer}>
              <Text style={[styles.characterCount, { color: getCharacterColor() }]}>
                {getCharacterCount()}/{maxLength}
              </Text>
              <Text style={styles.messageCount}>{getMessageCount()}</Text>
            </View>
          </View>
          <TextInput
            style={styles.messageInput}
            value={body}
            onChangeText={setBody}
            placeholder={`Enter your message (max ${maxLength} chars)`}
            multiline
            textAlignVertical="top"
            maxLength={maxLength}
          />
          {body.length > MAX_SMS_LENGTH && !attachment && (
            <Text style={styles.warningText}>
              Message will be split into multiple SMS messages
            </Text>
          )}
        </View>

        {/* Attachment */}
        {attachment ? (
          <View style={styles.attachmentContainer}>
            <Text style={styles.fieldLabel}>Photo Attachment:</Text>
            <View style={styles.attachmentPreview}>
              <Image
                source={{ uri: attachment.uri }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={removeAttachment}
                style={styles.removeAttachmentButton}
              >
                <Text style={styles.removeAttachmentText}>Remove</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.mmsNote}>
              This will be sent as MMS (picture message)
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAttachPhoto}
            style={styles.attachButton}
          >
            <Text style={styles.attachButtonText}>📷 Attach Photo</Text>
          </TouchableOpacity>
        )}

        {/* SMS Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>SMS Information:</Text>
          <Text style={styles.infoText}>
            • Standard SMS: 160 characters per message
          </Text>
          <Text style={styles.infoText}>
            • MMS (with photo): Up to 1,600 characters
          </Text>
          <Text style={styles.infoText}>
            • Carrier rates may apply
          </Text>
        </View>
      </ScrollView>

      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={isSending}
        style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.sendButtonText}>
            Send {attachment ? 'MMS' : 'SMS'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <MessageTemplateSelector
          type="sms"
          onSelect={handleTemplateSelected}
          onClose={() => setShowTemplateSelector(false)}
          context={context}
        />
      )}

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => setShowContactPicker(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.contactList}>
              {availableContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() => handleContactSelected(contact)}
                  style={styles.contactItem}
                  disabled={!contact.phoneNumber}
                >
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.phoneNumber && (
                      <Text style={styles.contactPhone}>
                        {contact.phoneNumber}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  draftButton: {
    padding: 8,
  },
  draftButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  contextBanner: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  contextText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  fieldContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  contactButton: {
    marginLeft: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 24,
  },
  templateButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  templateButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  characterCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  messageInput: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 150,
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  attachmentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  attachmentPreview: {
    marginTop: 8,
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  removeAttachmentButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  removeAttachmentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mmsNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  attachButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  infoContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sendButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 28,
    color: '#666',
  },
  contactList: {
    flex: 1,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
