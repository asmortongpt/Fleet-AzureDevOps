/**
 * EmailComposer Component
 * Rich email composer with contact picker, attachments, and context-aware pre-filling
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
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  EmailDraft,
  EmailRecipient,
  EmailAttachment,
  MessagingContext,
  Contact,
} from '../types/messaging.types';
import { MessagingService } from '../services/MessagingService';
import { MessageTemplateSelector } from './MessageTemplateSelector';

interface EmailComposerProps {
  context?: MessagingContext;
  onSend?: (draft: EmailDraft) => void;
  onCancel?: () => void;
  initialDraft?: EmailDraft;
  availableContacts?: Contact[];
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  context,
  onSend,
  onCancel,
  initialDraft,
  availableContacts = [],
}) => {
  const [to, setTo] = useState<EmailRecipient[]>(initialDraft?.to || []);
  const [cc, setCc] = useState<EmailRecipient[]>(initialDraft?.cc || []);
  const [bcc, setBcc] = useState<EmailRecipient[]>(initialDraft?.bcc || []);
  const [subject, setSubject] = useState(initialDraft?.subject || '');
  const [body, setBody] = useState(initialDraft?.body || '');
  const [attachments, setAttachments] = useState<EmailAttachment[]>(
    initialDraft?.attachments || []
  );
  const [importance, setImportance] = useState<'low' | 'normal' | 'high'>(
    initialDraft?.importance || 'normal'
  );
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [toInputText, setToInputText] = useState('');
  const [ccInputText, setCcInputText] = useState('');
  const [bccInputText, setBccInputText] = useState('');

  const messagingService = new MessagingService();

  useEffect(() => {
    // Pre-fill from context if available
    if (context?.prefillData) {
      if (context.prefillData.subject) {
        setSubject(context.prefillData.subject);
      }
      if (context.prefillData.body) {
        setBody(context.prefillData.body);
      }
      if (context.prefillData.recipients) {
        const recipients = context.prefillData.recipients.map((email) => ({
          email,
          name: email,
        }));
        setTo(recipients);
      }
    }
  }, [context]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addRecipient = (
    email: string,
    type: 'to' | 'cc' | 'bcc'
  ): boolean => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    const recipient: EmailRecipient = { email, name: email };

    switch (type) {
      case 'to':
        if (!to.find((r) => r.email === email)) {
          setTo([...to, recipient]);
          setToInputText('');
        }
        break;
      case 'cc':
        if (!cc.find((r) => r.email === email)) {
          setCc([...cc, recipient]);
          setCcInputText('');
        }
        break;
      case 'bcc':
        if (!bcc.find((r) => r.email === email)) {
          setBcc([...bcc, recipient]);
          setBccInputText('');
        }
        break;
    }
    return true;
  };

  const removeRecipient = (
    email: string,
    type: 'to' | 'cc' | 'bcc'
  ): void => {
    switch (type) {
      case 'to':
        setTo(to.filter((r) => r.email !== email));
        break;
      case 'cc':
        setCc(cc.filter((r) => r.email !== email));
        break;
      case 'bcc':
        setBcc(bcc.filter((r) => r.email !== email));
        break;
    }
  };

  const handleAttachDocument = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      const newAttachments: EmailAttachment[] = results.map((result) => ({
        name: result.name || 'document',
        uri: result.uri,
        type: result.type || 'application/octet-stream',
        size: result.size || 0,
      }));

      setAttachments([...attachments, ...newAttachments]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const handleAttachPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5,
      });

      if (result.assets) {
        const newAttachments: EmailAttachment[] = result.assets.map(
          (asset) => ({
            name: asset.fileName || 'photo.jpg',
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 0,
          })
        );

        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const removeAttachment = (uri: string) => {
    setAttachments(attachments.filter((att) => att.uri !== uri));
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const draft: EmailDraft = {
        to,
        cc,
        bcc,
        subject,
        body,
        bodyType: 'html',
        attachments,
        importance,
        linkedEntityType: context?.entityType,
        linkedEntityId: context?.entityId,
        updatedAt: new Date(),
      };

      await messagingService.saveDraft('email', draft);
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSend = async () => {
    // Validation
    if (to.length === 0) {
      Alert.alert('Error', 'Please add at least one recipient');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const entityLinks = context
        ? [
            {
              entity_type: context.entityType,
              entity_id: context.entityId,
              link_type: 'Related',
            },
          ]
        : undefined;

      const response = await messagingService.sendEmail({
        to: to.map((r) => r.email),
        cc: cc.length > 0 ? cc.map((r) => r.email) : undefined,
        bcc: bcc.length > 0 ? bcc.map((r) => r.email) : undefined,
        subject,
        body,
        bodyType: 'html',
        attachments,
        importance,
        entityLinks,
      });

      if (response.success) {
        Alert.alert('Success', 'Email sent successfully');
        if (onSend) {
          const draft: EmailDraft = {
            to,
            cc,
            bcc,
            subject,
            body,
            bodyType: 'html',
            attachments,
            importance,
          };
          onSend(draft);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to send email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelected = (template: any, variables: any) => {
    if (template.subject) {
      setSubject(template.subject);
    }
    setBody(template.body);
    setShowTemplateSelector(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Email</Text>
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

        {/* To Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>To:</Text>
          <View style={styles.recipientContainer}>
            {to.map((recipient) => (
              <View key={recipient.email} style={styles.recipientChip}>
                <Text style={styles.recipientText}>
                  {recipient.name || recipient.email}
                </Text>
                <TouchableOpacity
                  onPress={() => removeRecipient(recipient.email, 'to')}
                >
                  <Text style={styles.removeRecipient}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TextInput
              style={styles.recipientInput}
              value={toInputText}
              onChangeText={setToInputText}
              placeholder="Add email"
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={() => {
                if (toInputText.trim()) {
                  addRecipient(toInputText.trim(), 'to');
                }
              }}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowCc(!showCc)}
            style={styles.ccBccButton}
          >
            <Text style={styles.ccBccButtonText}>
              {showCc ? 'Hide Cc/Bcc' : 'Show Cc/Bcc'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cc Field */}
        {showCc && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Cc:</Text>
            <View style={styles.recipientContainer}>
              {cc.map((recipient) => (
                <View key={recipient.email} style={styles.recipientChip}>
                  <Text style={styles.recipientText}>
                    {recipient.name || recipient.email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeRecipient(recipient.email, 'cc')}
                  >
                    <Text style={styles.removeRecipient}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={styles.recipientInput}
                value={ccInputText}
                onChangeText={setCcInputText}
                placeholder="Add Cc"
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={() => {
                  if (ccInputText.trim()) {
                    addRecipient(ccInputText.trim(), 'cc');
                  }
                }}
              />
            </View>
          </View>
        )}

        {/* Bcc Field */}
        {showCc && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bcc:</Text>
            <View style={styles.recipientContainer}>
              {bcc.map((recipient) => (
                <View key={recipient.email} style={styles.recipientChip}>
                  <Text style={styles.recipientText}>
                    {recipient.name || recipient.email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeRecipient(recipient.email, 'bcc')}
                  >
                    <Text style={styles.removeRecipient}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={styles.recipientInput}
                value={bccInputText}
                onChangeText={setBccInputText}
                placeholder="Add Bcc"
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={() => {
                  if (bccInputText.trim()) {
                    addRecipient(bccInputText.trim(), 'bcc');
                  }
                }}
              />
            </View>
          </View>
        )}

        {/* Subject Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Subject:</Text>
          <TextInput
            style={styles.subjectInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject"
          />
        </View>

        {/* Importance Selector */}
        <View style={styles.importanceContainer}>
          <Text style={styles.fieldLabel}>Importance:</Text>
          <View style={styles.importanceButtons}>
            {(['low', 'normal', 'high'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setImportance(level)}
                style={[
                  styles.importanceButton,
                  importance === level && styles.importanceButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.importanceButtonText,
                    importance === level && styles.importanceButtonTextActive,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Template Button */}
        <TouchableOpacity
          onPress={() => setShowTemplateSelector(true)}
          style={styles.templateButton}
        >
          <Text style={styles.templateButtonText}>Use Template</Text>
        </TouchableOpacity>

        {/* Body Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Message:</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Enter your message"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Attachments */}
        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text style={styles.fieldLabel}>Attachments:</Text>
            {attachments.map((attachment) => (
              <View key={attachment.uri} style={styles.attachmentItem}>
                <Text style={styles.attachmentName}>{attachment.name}</Text>
                <Text style={styles.attachmentSize}>
                  {(attachment.size / 1024).toFixed(1)} KB
                </Text>
                <TouchableOpacity
                  onPress={() => removeAttachment(attachment.uri)}
                >
                  <Text style={styles.removeAttachment}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Attachment Buttons */}
        <View style={styles.attachmentButtons}>
          <TouchableOpacity
            onPress={handleAttachPhoto}
            style={styles.attachButton}
          >
            <Text style={styles.attachButtonText}>📷 Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAttachDocument}
            style={styles.attachButton}
          >
            <Text style={styles.attachButtonText}>📎 Document</Text>
          </TouchableOpacity>
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
          <Text style={styles.sendButtonText}>Send Email</Text>
        )}
      </TouchableOpacity>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <MessageTemplateSelector
          type="email"
          onSelect={handleTemplateSelected}
          onClose={() => setShowTemplateSelector(false)}
          context={context}
        />
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
  recipientContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 14,
    color: '#1976D2',
    marginRight: 4,
  },
  removeRecipient: {
    fontSize: 18,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    minWidth: 120,
  },
  ccBccButton: {
    marginTop: 8,
  },
  ccBccButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  subjectInput: {
    fontSize: 16,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  importanceContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  importanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  importanceButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  importanceButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  importanceButtonText: {
    fontSize: 14,
    color: '#666',
  },
  importanceButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  bodyInput: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 200,
  },
  attachmentsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  removeAttachment: {
    color: '#FF3B30',
    fontSize: 14,
  },
  attachmentButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  attachButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  sendButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
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
});
