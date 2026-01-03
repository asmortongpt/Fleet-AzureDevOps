import React, { useState, useEffect } from 'react';

/**
 * BuildVersion Component
 * Displays current build version and timestamp in bottom-right corner
 * Shows with animation on load to confirm latest version is running
 */
export const BuildVersion: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Check if user previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('buildVersionDismissed');
    if (dismissed === BUILD_TIMESTAMP) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('buildVersionDismissed', BUILD_TIMESTAMP);
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  const BUILD_TIMESTAMP = '2026-01-03T00:52:00Z';
  const BUILD_VERSION = 'v1.0.0-100%';
  const COMMIT_HASH = '71f843b';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#10b981',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={handleDismiss}
      title="Click to dismiss"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
            ✅ {BUILD_VERSION} - Latest Build
          </div>
          <div style={{ fontSize: '10px', opacity: 0.9 }}>
            {new Date(BUILD_TIMESTAMP).toLocaleString()} • {COMMIT_HASH}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default BuildVersion;
