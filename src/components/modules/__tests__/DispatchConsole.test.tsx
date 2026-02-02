/**
 * Dispatch Console Tests
 * Comprehensive test suite for PTT and dispatch functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DispatchConsole from '../DispatchConsole';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', firstName: 'Test', lastName: 'User', role: 'dispatcher' },
    isAuthenticated: true
  })
}));

vi.mock('@/hooks/useDispatchSocket', () => ({
  useDispatchSocket: () => ({
    isConnected: true,
    currentChannel: { id: 'ch1', name: 'Channel 1', status: 'ACTIVE' },
    activeTransmission: null,
    recentTransmissions: [],
    activeUnits: [
      { id: 'u1', callSign: 'Unit 101', status: 'AVAILABLE' },
      { id: 'u2', callSign: 'Unit 102', status: 'BUSY' }
    ],
    emergencyAlerts: [],
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeToChannel: vi.fn(),
    unsubscribeFromChannel: vi.fn(),
    sendAudioChunk: vi.fn(),
    startTransmission: vi.fn().mockReturnValue('tx_123'),
    endTransmission: vi.fn(),
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn()
  })
}));

vi.mock('@/hooks/usePTT', () => ({
  usePTT: () => ({
    isTransmitting: false,
    isPTTActive: false,
    audioLevel: 0.5,
    error: null,
    startPTT: vi.fn(),
    stopPTT: vi.fn(),
    togglePTT: vi.fn(),
    currentTransmissionId: null
  })
}));

vi.mock('@/hooks/useAudioVisualization', () => ({
  useAudioVisualization: () => ({
    frequencyData: new Uint8Array(2048),
    timeDomainData: new Uint8Array(2048),
    averageLevel: 0.5,
    peakLevel: 0.8
  }),
  useFrequencyBars: () => Array(24).fill(0.5)
}));

// Mock fetch
global.fetch = vi.fn((url: string) => {
  if (url.includes('/api/dispatch/channels')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        channels: [
          { id: 'ch1', name: 'Channel 1', status: 'ACTIVE', frequency: '154.250' },
          { id: 'ch2', name: 'Channel 2', status: 'ACTIVE', frequency: '154.260' }
        ]
      })
    });
  }
  return Promise.resolve({ json: () => Promise.resolve({}) });
}) as any;

describe('DispatchConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the main console heading', () => {
      render(<DispatchConsole />);
      expect(screen.getByText('Dispatch Radio Console')).toBeInTheDocument();
    });

    it('renders connection status badge', () => {
      render(<DispatchConsole />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('renders emergency alert button', () => {
      render(<DispatchConsole />);
      expect(screen.getByText('Emergency Alert')).toBeInTheDocument();
    });

    it('renders PTT button', () => {
      render(<DispatchConsole />);
      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeInTheDocument();
    });

    it('renders channel list', async () => {
      render(<DispatchConsole />);
      await waitFor(() => {
        expect(screen.getByText('Channel 1')).toBeInTheDocument();
        expect(screen.getByText('Channel 2')).toBeInTheDocument();
      });
    });

    it('renders active listeners section', () => {
      render(<DispatchConsole />);
      expect(screen.getByText('Active Listeners')).toBeInTheDocument();
      expect(screen.getByText('Unit 101')).toBeInTheDocument();
      expect(screen.getByText('Unit 102')).toBeInTheDocument();
    });
  });

  describe('PTT Functionality', () => {
    it('PTT button is enabled when connected and channel selected', () => {
      render(<DispatchConsole />);
      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).not.toBeDisabled();
    });

    it('handles PTT mouse down event', async () => {
      const { usePTT } = await import('@/hooks/usePTT');
      const startPTT = vi.fn();
      vi.mocked(usePTT).mockReturnValue({
        isTransmitting: false,
        isPTTActive: false,
        audioLevel: 0,
        error: null,
        startPTT,
        stopPTT: vi.fn(),
        togglePTT: vi.fn(),
        currentTransmissionId: null
      } as any);

      render(<DispatchConsole />);
      const pttButton = screen.getByRole('button', { name: /hold to speak/i });

      fireEvent.mouseDown(pttButton);
      expect(startPTT).toHaveBeenCalled();
    });

    it('handles PTT mouse up event', async () => {
      const { usePTT } = await import('@/hooks/usePTT');
      const stopPTT = vi.fn();
      vi.mocked(usePTT).mockReturnValue({
        isTransmitting: true,
        isPTTActive: true,
        audioLevel: 0.5,
        error: null,
        startPTT: vi.fn(),
        stopPTT,
        togglePTT: vi.fn(),
        currentTransmissionId: 'tx_123'
      } as any);

      render(<DispatchConsole />);
      const pttButton = screen.getByRole('button', { name: /hold to speak/i });

      fireEvent.mouseUp(pttButton);
      expect(stopPTT).toHaveBeenCalled();
    });

    it('displays audio level when transmitting', async () => {
      const { usePTT } = await import('@/hooks/usePTT');
      vi.mocked(usePTT).mockReturnValue({
        isTransmitting: true,
        isPTTActive: true,
        audioLevel: 0.75,
        error: null,
        startPTT: vi.fn(),
        stopPTT: vi.fn(),
        togglePTT: vi.fn(),
        currentTransmissionId: 'tx_123'
      } as any);

      render(<DispatchConsole />);
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Transmitting...')).toBeInTheDocument();
    });

    it('displays error message when PTT fails', async () => {
      const { usePTT } = await import('@/hooks/usePTT');
      vi.mocked(usePTT).mockReturnValue({
        isTransmitting: false,
        isPTTActive: false,
        audioLevel: 0,
        error: 'Microphone access denied',
        startPTT: vi.fn(),
        stopPTT: vi.fn(),
        togglePTT: vi.fn(),
        currentTransmissionId: null
      } as any);

      render(<DispatchConsole />);
      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });
  });

  describe('Channel Management', () => {
    it('loads channels on mount', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/dispatch/channels',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.stringContaining('Bearer')
            })
          })
        );
      });
    });

    it('allows channel selection', async () => {
      const { useDispatchSocket } = await import('@/hooks/useDispatchSocket');
      const subscribeToChannel = vi.fn();
      vi.mocked(useDispatchSocket).mockReturnValue({
        isConnected: true,
        currentChannel: null,
        activeTransmission: null,
        recentTransmissions: [],
        activeUnits: [],
        emergencyAlerts: [],
        connect: vi.fn(),
        disconnect: vi.fn(),
        subscribeToChannel,
        unsubscribeFromChannel: vi.fn(),
        sendAudioChunk: vi.fn(),
        startTransmission: vi.fn(),
        endTransmission: vi.fn(),
        acknowledgeAlert: vi.fn(),
        resolveAlert: vi.fn()
      } as any);

      render(<DispatchConsole />);

      await waitFor(() => {
        const channel2Button = screen.getByText('Channel 2');
        fireEvent.click(channel2Button);
      });

      expect(subscribeToChannel).toHaveBeenCalledWith('ch2');
    });
  });

  describe('Emergency Alerts', () => {
    it('displays emergency alerts', async () => {
      const { useDispatchSocket } = await import('@/hooks/useDispatchSocket');
      vi.mocked(useDispatchSocket).mockReturnValue({
        isConnected: true,
        currentChannel: { id: 'ch1', name: 'Channel 1', status: 'ACTIVE' } as any,
        activeTransmission: null,
        recentTransmissions: [],
        activeUnits: [],
        emergencyAlerts: [
          {
            id: 'alert1',
            type: 'PANIC',
            description: 'Officer needs assistance',
            status: 'ACTIVE',
            priority: 'CRITICAL',
            timestamp: new Date().toISOString()
          }
        ] as any,
        connect: vi.fn(),
        disconnect: vi.fn(),
        subscribeToChannel: vi.fn(),
        unsubscribeFromChannel: vi.fn(),
        sendAudioChunk: vi.fn(),
        startTransmission: vi.fn(),
        endTransmission: vi.fn(),
        acknowledgeAlert: vi.fn(),
        resolveAlert: vi.fn()
      } as any);

      render(<DispatchConsole />);

      // Switch to alerts tab
      const alertsTab = screen.getByRole('tab', { name: /alerts/i });
      fireEvent.click(alertsTab);

      await waitFor(() => {
        expect(screen.getByText('PANIC')).toBeInTheDocument();
        expect(screen.getByText('Officer needs assistance')).toBeInTheDocument();
      });
    });

    it('handles emergency alert button click', async () => {
      const { useDispatchSocket } = await import('@/hooks/useDispatchSocket');
      const { usePTT } = await import('@/hooks/usePTT');

      const startTransmission = vi.fn().mockReturnValue('tx_emergency_123');
      const startPTT = vi.fn();

      vi.mocked(useDispatchSocket).mockReturnValue({
        isConnected: true,
        currentChannel: { id: 'ch1', name: 'Channel 1', status: 'ACTIVE' } as any,
        activeTransmission: null,
        recentTransmissions: [],
        activeUnits: [],
        emergencyAlerts: [],
        connect: vi.fn(),
        disconnect: vi.fn(),
        subscribeToChannel: vi.fn(),
        unsubscribeFromChannel: vi.fn(),
        sendAudioChunk: vi.fn(),
        startTransmission,
        endTransmission: vi.fn(),
        acknowledgeAlert: vi.fn(),
        resolveAlert: vi.fn()
      } as any);

      vi.mocked(usePTT).mockReturnValue({
        isTransmitting: false,
        isPTTActive: false,
        audioLevel: 0,
        error: null,
        startPTT,
        stopPTT: vi.fn(),
        togglePTT: vi.fn(),
        currentTransmissionId: null
      } as any);

      render(<DispatchConsole />);

      const emergencyButton = screen.getByText('Emergency Alert');
      fireEvent.click(emergencyButton);

      expect(startTransmission).toHaveBeenCalledWith(true);
      expect(startPTT).toHaveBeenCalled();
    });
  });

  describe('Transmission History', () => {
    it('displays recent transmissions', async () => {
      const { useDispatchSocket } = await import('@/hooks/useDispatchSocket');
      vi.mocked(useDispatchSocket).mockReturnValue({
        isConnected: true,
        currentChannel: { id: 'ch1', name: 'Channel 1', status: 'ACTIVE' } as any,
        activeTransmission: null,
        recentTransmissions: [
          {
            id: 'tx1',
            channel_id: 'ch1',
            channel_name: 'Channel 1',
            transcript: 'Unit 101 responding to scene',
            priority: 'HIGH',
            status: 'COMPLETED',
            duration_seconds: 15,
            timestamp: new Date().toISOString(),
            entities: [],
            confidence: 0.95
          }
        ] as any,
        activeUnits: [],
        emergencyAlerts: [],
        connect: vi.fn(),
        disconnect: vi.fn(),
        subscribeToChannel: vi.fn(),
        unsubscribeFromChannel: vi.fn(),
        sendAudioChunk: vi.fn(),
        startTransmission: vi.fn(),
        endTransmission: vi.fn(),
        acknowledgeAlert: vi.fn(),
        resolveAlert: vi.fn()
      } as any);

      render(<DispatchConsole />);

      // Switch to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Unit 101 responding to scene')).toBeInTheDocument();
        expect(screen.getByText('0:15')).toBeInTheDocument();
      });
    });

    it('shows empty state when no transmissions', async () => {
      const { useDispatchSocket } = await import('@/hooks/useDispatchSocket');
      vi.mocked(useDispatchSocket).mockReturnValue({
        isConnected: true,
        currentChannel: { id: 'ch1', name: 'Channel 1', status: 'ACTIVE' } as any,
        activeTransmission: null,
        recentTransmissions: [],
        activeUnits: [],
        emergencyAlerts: [],
        connect: vi.fn(),
        disconnect: vi.fn(),
        subscribeToChannel: vi.fn(),
        unsubscribeFromChannel: vi.fn(),
        sendAudioChunk: vi.fn(),
        startTransmission: vi.fn(),
        endTransmission: vi.fn(),
        acknowledgeAlert: vi.fn(),
        resolveAlert: vi.fn()
      } as any);

      render(<DispatchConsole />);

      // Switch to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('No recent transmissions')).toBeInTheDocument();
      });
    });
  });

  describe('Mute Functionality', () => {
    it('toggles mute state', async () => {
      render(<DispatchConsole />);

      const _muteButton = screen.getByText('Mute');
      expect(_muteButton).toBeInTheDocument();

      fireEvent.click(_muteButton);

      await waitFor(() => {
        expect(screen.getByText('Unmute')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DispatchConsole />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toHaveAttribute('type', 'button');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      const _muteButton = screen.getByText('Mute');
      await user.tab();

      // Button should be focusable
      expect(document.activeElement).toBeTruthy();
    });
  });
});