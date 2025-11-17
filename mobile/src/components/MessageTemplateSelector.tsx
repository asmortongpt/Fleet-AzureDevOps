/**
 * MessageTemplateSelector Component
 * Select and customize message templates with variable substitution
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  MessageTemplate,
  TemplateVariable,
  MessagingContext,
} from '../types/messaging.types';
import { MessagingService } from '../services/MessagingService';

interface MessageTemplateSelectorProps {
  type: 'email' | 'sms' | 'teams';
  onSelect: (template: MessageTemplate, variables: Record<string, string>) => void;
  onClose: () => void;
  context?: MessagingContext;
}

export const MessageTemplateSelector: React.FC<MessageTemplateSelectorProps> = ({
  type,
  onSelect,
  onClose,
  context,
}) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const messagingService = new MessagingService();

  useEffect(() => {
    loadTemplates();
  }, [type]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await messagingService.getTemplates(type);
      if (response.success && response.templates) {
        setTemplates(response.templates);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(response.templates.map((t) => t.category))
        );
        setCategories(['all', ...uniqueCategories]);
      } else {
        Alert.alert('Error', 'Failed to load templates');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.body.toLowerCase().includes(query) ||
          (t.subject && t.subject.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);

    // Initialize variables with context data if available
    const initialVariables: Record<string, string> = {};
    template.variables.forEach((varName) => {
      initialVariables[varName] = getContextValue(varName) || '';
    });
    setVariables(initialVariables);

    if (template.variables.length > 0) {
      setShowPreview(true);
    } else {
      // No variables, use template as-is
      onSelect(template, {});
    }
  };

  const getContextValue = (variableName: string): string | undefined => {
    if (!context) return undefined;

    const varLower = variableName.toLowerCase();

    // Map common variable names to context data
    if (varLower.includes('vehicle') && context.entityType === 'vehicle') {
      return context.entityName;
    }
    if (varLower.includes('driver') && context.entityType === 'driver') {
      return context.entityName;
    }
    if (varLower.includes('workorder') && context.entityType === 'work_order') {
      return context.entityName;
    }
    if (varLower.includes('date')) {
      return new Date().toLocaleDateString();
    }
    if (varLower.includes('time')) {
      return new Date().toLocaleTimeString();
    }

    return undefined;
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariables({
      ...variables,
      [varName]: value,
    });
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    // Validate that all variables are filled
    const missingVars = selectedTemplate.variables.filter(
      (varName) => !variables[varName]?.trim()
    );

    if (missingVars.length > 0) {
      Alert.alert(
        'Missing Variables',
        `Please fill in: ${missingVars.join(', ')}`
      );
      return;
    }

    // Replace variables in template
    let processedTemplate = { ...selectedTemplate };
    if (processedTemplate.subject) {
      processedTemplate.subject = replaceVariables(
        processedTemplate.subject,
        variables
      );
    }
    processedTemplate.body = replaceVariables(processedTemplate.body, variables);

    onSelect(processedTemplate, variables);
  };

  const replaceVariables = (
    text: string,
    vars: Record<string, string>
  ): string => {
    let result = text;
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      result = result.replace(regex, value);
    });
    return result;
  };

  const getPreviewText = (): string => {
    if (!selectedTemplate) return '';

    let preview = selectedTemplate.body;
    if (selectedTemplate.subject) {
      preview = `Subject: ${selectedTemplate.subject}\n\n${preview}`;
    }

    return replaceVariables(preview, variables);
  };

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Template</Text>
          <View style={styles.placeholder} />
        </View>

        {!showPreview ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search templates..."
                placeholderTextColor="#999"
              />
            </View>

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Template List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading templates...</Text>
              </View>
            ) : filteredTemplates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No templates found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'No templates available for this category'}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.templateList}>
                {filteredTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleTemplateSelect(template)}
                    style={styles.templateItem}
                  >
                    <View style={styles.templateHeader}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getCategoryColor(template.category) },
                        ]}
                      >
                        <Text style={styles.categoryBadgeText}>
                          {template.category}
                        </Text>
                      </View>
                    </View>
                    {template.subject && (
                      <Text style={styles.templateSubject} numberOfLines={1}>
                        Subject: {template.subject}
                      </Text>
                    )}
                    <Text style={styles.templateBody} numberOfLines={2}>
                      {template.body}
                    </Text>
                    {template.variables.length > 0 && (
                      <View style={styles.variablesBadge}>
                        <Text style={styles.variablesBadgeText}>
                          {template.variables.length} variable
                          {template.variables.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <ScrollView style={styles.previewContainer}>
            {/* Template Info */}
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {selectedTemplate?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPreview(false)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Variable Inputs */}
            <View style={styles.variablesContainer}>
              <Text style={styles.sectionTitle}>Fill in Variables:</Text>
              {selectedTemplate?.variables.map((varName) => (
                <View key={varName} style={styles.variableInput}>
                  <Text style={styles.variableLabel}>
                    {varName.replace(/_/g, ' ').toUpperCase()}:
                  </Text>
                  <TextInput
                    style={styles.variableTextInput}
                    value={variables[varName] || ''}
                    onChangeText={(value) =>
                      handleVariableChange(varName, value)
                    }
                    placeholder={`Enter ${varName}`}
                  />
                </View>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview:</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>{getPreviewText()}</Text>
              </View>
            </View>

            {/* Use Button */}
            <TouchableOpacity
              onPress={handleUseTemplate}
              style={styles.useButton}
            >
              <Text style={styles.useButtonText}>Use This Template</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    damage: '#FF3B30',
    maintenance: '#FF9500',
    safety: '#FF3B30',
    notification: '#007AFF',
    reminder: '#5856D6',
    inspection: '#34C759',
    general: '#8E8E93',
  };
  return colors[category.toLowerCase()] || '#8E8E93';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    fontSize: 16,
  },
  categoryContainer: {
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  templateList: {
    flex: 1,
  },
  templateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  templateSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  templateBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  variablesBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  variablesBadgeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  variablesContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  variableInput: {
    marginBottom: 16,
  },
  variableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  variableTextInput: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    fontSize: 16,
  },
  previewSection: {
    padding: 16,
  },
  previewBox: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  useButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
