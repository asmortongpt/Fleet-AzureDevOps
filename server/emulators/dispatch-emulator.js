const { Server } = require('socket.io');
const io = new Server(8083, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

console.log('Dispatch Emulator running on port 8083');

const eventTypes = ['call', 'assignment', 'status_update', 'alert', 'clear', 'enroute'];
const priorities = ['low', 'normal', 'high', 'critical'];
const locations = [
  { lat: 30.2672, lng: -97.7431, address: '1234 Main St' },
  { lat: 30.2500, lng: -97.7500, address: '5678 Oak Ave' },
  { lat: 30.2800, lng: -97.7300, address: '9012 Pine Rd' },
  { lat: 30.2400, lng: -97.7600, address: '3456 Elm Blvd' }
];

io.on('connection', (socket) => {
  console.log('Dispatch client connected:', socket.id);

  // Emit dispatch events every 10 seconds
  const interval = setInterval(() => {
    const location = locations[Math.floor(Math.random() * locations.length)];
    socket.emit('event', {
      timestamp: new Date().toISOString(),
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      vehicleId: Math.floor(Math.random() * 50) + 1,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address
      },
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      description: 'Automated dispatch event',
      callId: `CALL-${Math.floor(Math.random() * 10000)}`
    });
  }, 10000);

  // Handle dispatch acknowledgments
  socket.on('acknowledge', (data) => {
    console.log('Event acknowledged:', data);
    socket.emit('acknowledged', {
      ...data,
      timestamp: new Date().toISOString(),
      status: 'acknowledged'
    });
  });

  // Handle status updates
  socket.on('updateStatus', (data) => {
    console.log('Status update received:', data);
    socket.broadcast.emit('statusUpdated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Dispatch client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Dispatch socket error:', error);
  });
});

io.on('error', (error) => {
  console.error('Dispatch server error:', error);
});
