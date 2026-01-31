import React, { useState } from 'react';

import FDOTMileageCalculator from '../mileage/FDOTMileageCalculator';
import logger from '@/utils/logger';

interface MileageData {
  startMileage: number;
  endMileage: number;
  purpose: string;
  date: string;
  driverName: string;
  vehicleId: string;
}

interface MileageFormViewProps {
  currentTheme: any;
  setActiveView: (view: string) => void;
}

const MileageFormView: React.FC<MileageFormViewProps> = ({ currentTheme, setActiveView }) => {
  const [activeTab, setActiveTab] = useState<'legacy' | 'fdot'>('fdot');
  const [formData, setFormData] = useState<MileageData>({
    startMileage: 0,
    endMileage: 0,
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    driverName: '',
    vehicleId: ''
  });

  const totalMiles = formData.endMileage - formData.startMileage;
  const reimbursement = totalMiles * 0.67; // FDOT rate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // logger.info('Mileage Reimbursement Submitted:', {
    //   ...formData,
    //   totalMiles,
    //   reimbursement,
    //   timestamp: new Date().toISOString()
    // });
    alert(`Mileage reimbursement submitted: $${reimbursement.toFixed(2)} for ${totalMiles} miles`);
  };

  return (
    <div style={{
      padding: '20px',
      background: currentTheme.bg,
      color: currentTheme.text,
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setActiveView('dashboard')}
          style={{
            padding: '8px 16px',
            background: currentTheme.secondary,
            color: currentTheme.text,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
          Mileage Reimbursement System
        </h1>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: currentTheme.surface,
        borderRadius: '12px 12px 0 0',
        padding: '0',
        marginBottom: '0',
        borderBottom: `1px solid ${currentTheme.border}`
      }}>
        <div style={{ display: 'flex' }}>
          <button
            type="button"
            onClick={() => setActiveTab('fdot')}
            style={{
              padding: '16px 24px',
              background: activeTab === 'fdot' ? currentTheme.primary : 'transparent',
              color: activeTab === 'fdot' ? 'white' : currentTheme.text,
              border: 'none',
              borderRadius: '12px 0 0 0',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            🏛️ Official FDOT Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('legacy')}
            style={{
              padding: '16px 24px',
              background: activeTab === 'legacy' ? currentTheme.primary : 'transparent',
              color: activeTab === 'legacy' ? 'white' : currentTheme.text,
              border: 'none',
              borderRadius: '0 12px 0 0',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            📝 Legacy Form
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'fdot' ? (
        <div style={{ marginTop: '0' }}>
          <FDOTMileageCalculator 
            className="rounded-t-none border-t-0"
            employeeId="FL123456"
            vehicleId={formData.vehicleId}
            onCalculationComplete={(result: any) => {
              // logger.info('FDOT Calculation Complete:', result);
            }}
          />
        </div>
      ) : (
        <div style={{
          background: currentTheme.surface,
          borderRadius: '0 0 12px 12px',
          padding: window.innerWidth < 768 ? '16px' : '24px',
          maxWidth: '600px',
          width: '100%'
        }}>
          <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.bg,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Vehicle ID
              </label>
              <input
                type="text"
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.bg,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Start Mileage
              </label>
              <input
                type="number"
                value={formData.startMileage}
                onChange={(e) => setFormData({...formData, startMileage: parseInt(e.target.value) || 0})}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.bg,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                End Mileage
              </label>
              <input
                type="number"
                value={formData.endMileage}
                onChange={(e) => setFormData({...formData, endMileage: parseInt(e.target.value) || 0})}
                required
                min={formData.startMileage}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.bg,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Trip Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              required
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text,
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.bg,
                color: currentTheme.text,
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{
            background: currentTheme.primary + '20',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: `1px solid ${currentTheme.primary}`
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: currentTheme.primary }}>
              Reimbursement Calculation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <strong>Total Miles:</strong><br />
                {totalMiles > 0 ? totalMiles : 0}
              </div>
              <div>
                <strong>FDOT Rate:</strong><br />
                $0.67/mile
              </div>
              <div>
                <strong>Reimbursement:</strong><br />
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme.success }}>
                  ${(reimbursement > 0 ? reimbursement : 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={totalMiles <= 0}
            style={{
              width: '100%',
              padding: '16px',
              background: totalMiles > 0 ? currentTheme.success : currentTheme.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: totalMiles > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            Submit Reimbursement Request (${(reimbursement > 0 ? reimbursement : 0).toFixed(2)})
          </button>
        </form>
        </div>
      )}
    </div>
  );
};

export default MileageFormView;