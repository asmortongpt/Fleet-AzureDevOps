import {
  Radio as RadioIcon,
  Mic,
  MicOff,
  Warning,
  People,
  VolumeUp,
  VolumeOff,
  Emergency,
  Sensors
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  Badge,
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  CircularProgress
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { useAudioVisualization, useFrequencyBars } from '@/hooks/useAudioVisualization';
import { useAuth } from '@/hooks/useAuth';
import { useDispatchSocket } from '@/hooks/useDispatchSocket';
import { usePTT } from '@/hooks/usePTT';
import type { RadioChannel } from '@/types/radio';
import logger from '@/utils/logger';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DispatchConsole() {
  const { user: _user } = useAuth();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // WebSocket connection
  const dispatch = useDispatchSocket({
    channelId: selectedChannelId || undefined,
    autoConnect: true,
    onEmergencyAlert: (alert) => {
      logger.debug('Emergency alert received:', alert);
    },
    onTransmission: (transmission) => {
      logger.debug('Transmission update:', transmission);
    }
  });

  // PTT functionality
  const ptt = usePTT({
    onAudioChunk: (audioData) => {
      if (ptt.currentTransmissionId) {
        dispatch.sendAudioChunk(audioData, ptt.currentTransmissionId);
      }
    },
    onTransmissionStart: (transmissionId) => {
      logger.debug('PTT started:', transmissionId);
    },
    onTransmissionEnd: (audioBlob) => {
      logger.debug('PTT ended, blob size:', audioBlob.size);
      const transmissionId = ptt.currentTransmissionId;
      if (transmissionId) {
        // Convert blob to base64 and send
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          dispatch.endTransmission(transmissionId, base64);
        };
        reader.readAsDataURL(audioBlob);
      }
    },
    enableKeyboardShortcut: true
  });

  // Audio visualization
  const audioViz = useAudioVisualization(analyserNode);
  const frequencyBars = useFrequencyBars(audioViz.frequencyData, 24);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await fetch('/api/dispatch/channels', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setChannels(data.channels);
          if (data.channels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(data.channels[0].id);
          }
        }
      } catch (error) {
        logger.error('Failed to load channels:', error);
      }
    };

    loadChannels();
  }, [selectedChannelId]);

  // Handle channel selection
  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    dispatch.subscribeToChannel(channelId);
  };

  // Emergency alert handler
  const handleEmergencyAlert = () => {
    const transmissionId = dispatch.startTransmission(true);
    if (transmissionId) {
      ptt.startPTT();
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      default:
        return 'success';
    }
  };

  // Get status color
  const getStatusColor = (status: string): 'error' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case 'EMERGENCY':
        return 'error';
      case 'BUSY':
        return 'warning';
      case 'AVAILABLE':
        return 'success';
      default:
        return 'default';
    }
  };

  // Format duration
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RadioIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Dispatch Radio Console
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time fleet communications
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<Sensors />}
            label={dispatch.isConnected ? 'Connected' : 'Disconnected'}
            color={dispatch.isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<Emergency />}
            onClick={handleEmergencyAlert}
            disabled={!dispatch.isConnected || !selectedChannelId}
          >
            Emergency Alert
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Channels */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RadioIcon /> Dispatch Channels
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                {channels.map((channel) => (
                  <ListItem
                    key={channel.id}
                    onClick={() => handleChannelSelect(channel.id)}
                    sx={{
                      borderLeft: selectedChannelId === channel.id ? '4px solid' : 'none',
                      borderColor: 'primary.main',
                      mb: 1,
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: channel.status === 'ACTIVE' ? 'success.main' : 'grey.500' }}>
                        <RadioIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={channel.name}
                      secondary={
                        <>
                          {channel.frequency && <>{channel.frequency} • </>}
                          {channel.status}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Center Panel - PTT Control */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {dispatch.currentChannel?.name || 'Select a channel'}
              </Typography>
              <Divider sx={{ my: 2 }} />

              {/* PTT Button */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 3 }}>
                <Tooltip title={ptt.isTransmitting ? 'Release to stop' : 'Hold to speak (or press Space)'}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton
                      size="large"
                      onMouseDown={ptt.startPTT}
                      onMouseUp={ptt.stopPTT}
                      onMouseLeave={ptt.stopPTT}
                      onTouchStart={ptt.startPTT}
                      onTouchEnd={ptt.stopPTT}
                      disabled={!dispatch.isConnected || !selectedChannelId}
                      sx={{
                        width: 160,
                        height: 160,
                        bgcolor: ptt.isTransmitting ? 'error.main' : 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: ptt.isTransmitting ? 'error.dark' : 'primary.dark'
                        },
                        '&:disabled': {
                          bgcolor: 'grey.300'
                        },
                        boxShadow: ptt.isTransmitting ? '0 0 30px rgba(244, 67, 54, 0.6)' : 4,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {ptt.isTransmitting ? <Mic sx={{ fontSize: 64 }} /> : <MicOff sx={{ fontSize: 64 }} />}
                    </IconButton>
                    {ptt.isTransmitting && (
                      <CircularProgress
                        size={180}
                        thickness={2}
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: -10,
                          color: 'error.main'
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>

                <Typography variant="body1" fontWeight="medium">
                  {ptt.isTransmitting ? 'Transmitting...' : 'Hold to speak'}
                </Typography>

                {/* Audio Level Meter */}
                {ptt.isTransmitting && (
                  <Box sx={{ width: '100%', px: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption">Audio Level</Typography>
                      <Typography variant="caption">{Math.round(ptt.audioLevel * 100)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={ptt.audioLevel * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />

                    {/* Frequency Bars */}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 2, height: 60, alignItems: 'flex-end' }}>
                      {frequencyBars.map((level, index) => (
                        <Box
                          key={index}
                          sx={{
                            flex: 1,
                            bgcolor: 'primary.main',
                            height: `${level * 100}%`,
                            minHeight: '2px',
                            borderRadius: 1,
                            transition: 'height 0.1s ease'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Error Display */}
                {ptt.error && (
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {ptt.error}
                  </Alert>
                )}

                {/* Active Transmission Alert */}
                {dispatch.activeTransmission && !ptt.isTransmitting && (
                  <Alert severity="info" icon={<RadioIcon />} sx={{ width: '100%' }}>
                    <AlertTitle>Incoming Transmission</AlertTitle>
                    Channel {dispatch.activeTransmission.channel_name} is active
                  </Alert>
                )}

                {/* Controls */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%', px: 4 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={isMuted ? <VolumeOff /> : <VolumeUp />}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                </Box>

                {/* Active Listeners */}
                <Paper variant="outlined" sx={{ width: '100%', p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People fontSize="small" /> Active Listeners
                    </Typography>
                    <Badge badgeContent={dispatch.activeUnits.length} color="primary">
                      <People />
                    </Badge>
                  </Box>
                  <List dense>
                    {dispatch.activeUnits.slice(0, 5).map((unit) => (
                      <ListItem key={unit.id} sx={{ py: 0.5 }}>
                        <Chip
                          size="small"
                          avatar={<Avatar sx={{ width: 20, height: 20, bgcolor: getStatusColor(unit.status) }}>•</Avatar>}
                          label={unit.callSign}
                          variant="outlined"
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Emergency Alerts & History */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
                <Tab label="Alerts" icon={<Warning />} iconPosition="start" />
                <Tab label="History" icon={<RadioIcon />} iconPosition="start" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom color="error">
                  Emergency Alerts
                </Typography>
                {/* Add content for emergency alerts if needed */}
                <Box />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Transmission History
                </Typography>
                {/* Add content for transmission history if needed */}
                <Box />
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}