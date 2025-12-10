/**
 * Consent Banner Component
 *
 * GDPR-compliant consent banner for telemetry and analytics.
 * Shows on first visit and allows users to configure privacy preferences.
 */

import React, { useState, useEffect } from 'react';

import { getTelemetryConfig } from '../config/telemetry';
import { PrivacyManager, PrivacyCategory } from '../utils/privacy';
interface ConsentBannerProps {
  position?: 'top' | 'bottom';
  showDetailsButton?: boolean;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  position = 'bottom',
  showDetailsButton = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<PrivacyCategory>>(
    new Set([PrivacyCategory.ESSENTIAL])
  );

  const config = getTelemetryConfig();

  useEffect(() => {
    // Check if consent is required and not yet given
    const requiresConsent = PrivacyManager.requiresConsent();
    setIsVisible(requiresConsent);
  }, []);

  if (!isVisible || !config.requireConsent) {
    return null;
  }

  const handleAcceptAll = () => {
    PrivacyManager.grantConsent();
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    PrivacyManager.denyConsent();
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    PrivacyManager.grantConsent(Array.from(selectedCategories));
    setIsVisible(false);
  };

  const toggleCategory = (category: PrivacyCategory) => {
    if (category === PrivacyCategory.ESSENTIAL) return; // Can't disable essential

    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  return (
    <div style={{
      ...styles.container,
      ...(position === 'top' ? styles.positionTop : styles.positionBottom),
    }}>
      <div style={styles.content}>
        {!showDetails ? (
          // Simple banner
          <>
            <div style={styles.text}>
              <h3 style={styles.title}>Your Privacy Matters</h3>
              <p style={styles.description}>
                We use cookies and analytics to improve your experience. Your data is anonymized
                and never sold. Learn more in our{' '}
                <a href="/privacy" style={styles.link} target="_blank" rel="noopener">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
            <div style={styles.actions}>
              <button onClick={handleRejectAll} style={styles.buttonSecondary}>
                Reject All
              </button>
              {showDetailsButton && (
                <button onClick={() => setShowDetails(true)} style={styles.buttonSecondary}>
                  Preferences
                </button>
              )}
              <button onClick={handleAcceptAll} style={styles.buttonPrimary}>
                Accept All
              </button>
            </div>
          </>
        ) : (
          // Detailed preferences
          <>
            <div style={styles.detailsHeader}>
              <h3 style={styles.title}>Privacy Preferences</h3>
              <button onClick={() => setShowDetails(false)} style={styles.closeButton}>
