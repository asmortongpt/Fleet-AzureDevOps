/**
 * Consent Banner Component
 *
 * GDPR-compliant consent banner for telemetry and analytics.
 * Shows on first visit and allows users to configure privacy preferences.
 */

import React, { useState, useEffect } from 'react';
import { PrivacyManager, PrivacyCategory } from '../utils/privacy';import { getTelemetryConfig } from '../config/telemetry';

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
                ×
              </button>
            </div>
            <div style={styles.detailsContent}>
              <p style={styles.detailsDescription}>
                Choose which types of data collection you're comfortable with.
              </p>

              <div style={styles.categoryList}>
                {/* Essential */}
                <div style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <input
                      type="checkbox"
                      checked
                      disabled
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={styles.categoryName}>
                        Essential
                        <span style={styles.requiredBadge}>Required</span>
                      </div>
                      <div style={styles.categoryDescription}>
                        Required for the application to function properly. Cannot be disabled.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(PrivacyCategory.ANALYTICS)}
                      onChange={() => toggleCategory(PrivacyCategory.ANALYTICS)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={styles.categoryName}>Analytics</div>
                      <div style={styles.categoryDescription}>
                        Help us understand how you use the app to improve features and user experience.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(PrivacyCategory.PERFORMANCE)}
                      onChange={() => toggleCategory(PrivacyCategory.PERFORMANCE)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={styles.categoryName}>Performance</div>
                      <div style={styles.categoryDescription}>
                        Monitor performance metrics to identify and fix slow operations.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing */}
                <div style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(PrivacyCategory.MARKETING)}
                      onChange={() => toggleCategory(PrivacyCategory.MARKETING)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={styles.categoryName}>Marketing</div>
                      <div style={styles.categoryDescription}>
                        Personalize content and show relevant features based on your usage.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.detailsActions}>
              <button onClick={handleRejectAll} style={styles.buttonSecondary}>
                Reject All
              </button>
              <button onClick={handleSavePreferences} style={styles.buttonPrimary}>
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    left: 0,
    right: 0,
    zIndex: 10000,
    backgroundColor: 'white',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  positionTop: {
    top: 0,
  },
  positionBottom: {
    bottom: 0,
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 20,
  },
  text: {
    marginBottom: 16,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: 18,
    fontWeight: 600,
    color: '#1f2937',
  },
  description: {
    margin: 0,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  buttonPrimary: {
    padding: '10px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '10px 24px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 32,
    color: '#9ca3af',
    cursor: 'pointer',
    padding: 0,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContent: {
    marginBottom: 20,
  },
  detailsDescription: {
    margin: '0 0 20px 0',
    fontSize: 14,
    color: '#6b7280',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  categoryItem: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  categoryHeader: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  checkbox: {
    marginTop: 2,
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '2px 8px',
    borderRadius: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  detailsActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
  },
};

export default ConsentBanner;
