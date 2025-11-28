const { Server } = require('socket.io');
const io = new Server(8082, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

console.log('Radio Emulator running on port 8082');

const channels = ['Channel 1', 'Channel 2', 'Channel 3', 'Emergency'];
const callSigns = ['Alpha-1', 'Bravo-2', 'Charlie-3', 'Delta-4', 'Echo-5'];

io.on('connection', (socket) => {
  console.log('Radio client connected:', socket.id);

  // Emit radio transmissions every 5 seconds
  const interval = setInterval(() => {
    socket.emit('transmission', {
      timestamp: new Date().toISOString(),
      channel: channels[Math.floor(Math.random() * channels.length)],
      callSign: callSigns[Math.floor(Math.random() * callSigns.length)],
      message: 'Status update - all clear',
      priority: Math.random() > 0.9 ? 'high' : 'normal',
      duration: Math.floor(Math.random() * 10) + 3
    });
  }, 5000);

  // Handle push-to-talk events
  socket.on('ptt', (data) => {
    console.log('PTT pressed:', data);
    socket.broadcast.emit('transmission', {
      ...data,
      timestamp: new Date().toISOString(),
      relayed: true
    });
  });

  // Handle channel change
  socket.on('changeChannel', (channel) => {
    console.log('Channel changed to:', channel);
    socket.emit('channelChanged', { channel, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Radio client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Radio socket error:', error);
  });
});

io.on('error', (error) => {
  console.error('Radio server error:', error);
});
