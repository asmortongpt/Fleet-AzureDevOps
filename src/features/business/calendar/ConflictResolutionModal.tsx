import { AlertTriangle, Calendar, Clock, Car, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

interface ConflictResolutionModalProps {
  currentTheme: any;
  conflicts: any[];
  originalEvent: any;
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
}

interface ConflictResolution {
  action: 'reschedule' | 'override' | 'merge' | 'cancel';
  newDate?: Date;
  newTime?: string;
  mergeWithId?: string;
  notes?: string;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  currentTheme,
  conflicts,
  originalEvent,
  onResolve,
  onCancel
}) => {
  const [selectedResolution, setSelectedResolution] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(
    originalEvent.start.toISOString().split('T')[0]
  );
  const [newTime, setNewTime] = useState<string>(
    originalEvent.start.toTimeString().slice(0, 5)
  );
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedMergeEvent, setSelectedMergeEvent] = useState<string>('');

  const suggestAlternativeTimes = () => {
    const suggestions = [];
    const eventDuration = originalEvent.end.getTime() - originalEvent.start.getTime();

    // Suggest times earlier in the day
    const earlyTime = new Date(originalEvent.start);
    earlyTime.setHours(8, 0, 0, 0);
    suggestions.push({
      time: earlyTime,
      reason: 'Early morning slot available'
    });

    // Suggest times later in the day
    const lateTime = new Date(originalEvent.start);
    lateTime.setHours(16, 0, 0, 0);
    suggestions.push({
      time: lateTime,
      reason: 'Late afternoon slot available'
    });

    // Suggest next available day
    const nextDay = new Date(originalEvent.start);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(originalEvent.start.getHours());
    suggestions.push({
      time: nextDay,
      reason: 'Same time next day'
    });

    // Suggest next week
    const nextWeek = new Date(originalEvent.start);
    nextWeek.setDate(nextWeek.getDate() + 7);
    suggestions.push({
      time: nextWeek,
      reason: 'Same time next week'
    });

    return suggestions;
  };

  const handleResolve = () => {
    const resolution: ConflictResolution = {
      action: selectedResolution as any,
      notes: resolutionNotes
    };

    if (selectedResolution === 'reschedule') {
      const newDateTime = new Date(`${newDate}T${newTime}`);
      resolution.newDate = newDateTime;
    } else if (selectedResolution === 'merge') {
      resolution.mergeWithId = selectedMergeEvent;
    }

    onResolve(resolution);
  };

  const getConflictSeverity = (conflict: any) => {
    if (conflict.type === 'maintenance' && conflict.priority === 'critical') return 'critical';
    if (conflict.type === 'reservation' && conflict.status === 'confirmed') return 'high';
    if (conflict.type === 'inspection') return 'high';
    return 'medium';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      default:
        return '#374151';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: currentTheme.surface,
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${currentTheme.border}`
        }}>
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <h2 style={{ margin: 0, color: currentTheme.text }}>
              Scheduling Conflict Detected
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              color: currentTheme.textMuted,
              fontSize: '14px'
            }}>
              {conflicts.length} conflicting event{conflicts.length > 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Original event */}
        <div style={{
          background: currentTheme.backgroundAlt,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            color: currentTheme.textMuted,
            marginBottom: '8px'
          }}>
            YOUR EVENT
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={16} color={currentTheme.primary} />
            <span style={{ fontWeight: 600, color: currentTheme.text }}>
              {originalEvent.title}
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '8px',
            fontSize: '14px',
            color: currentTheme.textMuted
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              {originalEvent.start.toLocaleDateString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              {originalEvent.start.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Conflicting events */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '14px',
            color: currentTheme.textMuted,
            marginBottom: '12px'
          }}>
            CONFLICTING EVENTS
          </h3>
          {conflicts.map(conflict => {
            const severity = getConflictSeverity(conflict);
            return (
              <div
                key={conflict.id}
                style={{
                  background: currentTheme.backgroundAlt,
                  borderLeft: `3px solid ${getSeverityColor(severity)}`,
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: currentTheme.text }}>
                      {conflict.title}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: currentTheme.textMuted,
                      marginTop: '4px'
                    }}>
                      {conflict.start.toLocaleTimeString()} - {conflict.end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <span style={{
                    background: getSeverityColor(severity) + '20',
                    color: getSeverityColor(severity),
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {severity.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resolution options */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '14px',
            color: currentTheme.textMuted,
            marginBottom: '12px'
          }}>
            RESOLUTION OPTIONS
          </h3>

          {/* Reschedule option */}
          <label style={{
            display: 'block',
            background: selectedResolution === 'reschedule' ? currentTheme.primary + '10' : currentTheme.backgroundAlt,
            border: `1px solid ${selectedResolution === 'reschedule' ? currentTheme.primary : currentTheme.border}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="resolution"
                value="reschedule"
                checked={selectedResolution === 'reschedule'}
                onChange={(e) => setSelectedResolution(e.target.value)}
              />
              <RefreshCw size={16} />
              <span style={{ fontWeight: 600, color: currentTheme.text }}>
                Reschedule Event
              </span>
            </div>
            {selectedResolution === 'reschedule' && (
              <div style={{ marginTop: '12px', marginLeft: '28px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: `1px solid ${currentTheme.border}`,
                      background: currentTheme.surface,
                      color: currentTheme.text
                    }}
                  />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: `1px solid ${currentTheme.border}`,
                      background: currentTheme.surface,
                      color: currentTheme.text
                    }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: currentTheme.textMuted }}>
                  <strong>Suggested times:</strong>
                  {suggestAlternativeTimes().map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setNewDate(suggestion.time.toISOString().split('T')[0]);
                        setNewTime(suggestion.time.toTimeString().slice(0, 5));
                      }}
                      style={{
                        display: 'block',
                        background: currentTheme.surface,
                        border: `1px solid ${currentTheme.border}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                        marginTop: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: currentTheme.text
                      }}
                    >
                      {suggestion.time.toLocaleString()} - {suggestion.reason}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </label>

          {/* Override option */}
          <label style={{
            display: 'block',
            background: selectedResolution === 'override' ? currentTheme.primary + '10' : currentTheme.backgroundAlt,
            border: `1px solid ${selectedResolution === 'override' ? currentTheme.primary : currentTheme.border}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="resolution"
                value="override"
                checked={selectedResolution === 'override'}
                onChange={(e) => setSelectedResolution(e.target.value)}
              />
              <CheckCircle size={16} />
              <span style={{ fontWeight: 600, color: currentTheme.text }}>
                Override Conflicts
              </span>
            </div>
            <p style={{
              margin: '8px 0 0 28px',
              fontSize: '13px',
              color: currentTheme.textMuted
            }}>
              Proceed with the original schedule (requires admin approval)
            </p>
          </label>

          {/* Merge option (if applicable) */}
          {conflicts.some(c => c.type === originalEvent.type) && (
            <label style={{
              display: 'block',
              background: selectedResolution === 'merge' ? currentTheme.primary + '10' : currentTheme.backgroundAlt,
              border: `1px solid ${selectedResolution === 'merge' ? currentTheme.primary : currentTheme.border}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="resolution"
                  value="merge"
                  checked={selectedResolution === 'merge'}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                />
                <Users size={16} />
                <span style={{ fontWeight: 600, color: currentTheme.text }}>
                  Merge with Existing Event
                </span>
              </div>
              {selectedResolution === 'merge' && (
                <div style={{ marginTop: '12px', marginLeft: '28px' }}>
                  <select
                    value={selectedMergeEvent}
                    onChange={(e) => setSelectedMergeEvent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: `1px solid ${currentTheme.border}`,
                      background: currentTheme.surface,
                      color: currentTheme.text
                    }}
                  >
                    <option value="">Select event to merge with</option>
                    {conflicts.filter(c => c.type === originalEvent.type).map(conflict => (
                      <option key={conflict.id} value={conflict.id}>
                        {conflict.title} - {conflict.start.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </label>
          )}

          {/* Cancel option */}
          <label style={{
            display: 'block',
            background: selectedResolution === 'cancel' ? currentTheme.primary + '10' : currentTheme.backgroundAlt,
            border: `1px solid ${selectedResolution === 'cancel' ? currentTheme.primary : currentTheme.border}`,
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="resolution"
                value="cancel"
                checked={selectedResolution === 'cancel'}
                onChange={(e) => setSelectedResolution(e.target.value)}
              />
              <XCircle size={16} />
              <span style={{ fontWeight: 600, color: currentTheme.text }}>
                Cancel Event
              </span>
            </div>
            <p style={{
              margin: '8px 0 0 28px',
              fontSize: '13px',
              color: currentTheme.textMuted
            }}>
              Remove this event from the schedule
            </p>
          </label>
        </div>

        {/* Resolution notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: currentTheme.textMuted,
            marginBottom: '8px'
          }}>
            RESOLUTION NOTES (OPTIONAL)
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Add any notes about this resolution"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.surface,
              color: currentTheme.text,
              resize: 'vertical',
              minHeight: '60px'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          paddingTop: '16px',
          borderTop: `1px solid ${currentTheme.border}`
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.surface,
              color: currentTheme.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedResolution || (selectedResolution === 'merge' && !selectedMergeEvent)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: selectedResolution ? currentTheme.primary : currentTheme.border,
              color: currentTheme.surface,
              cursor: selectedResolution ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 600,
              opacity: selectedResolution ? 1 : 0.5
            }}
          >
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;
