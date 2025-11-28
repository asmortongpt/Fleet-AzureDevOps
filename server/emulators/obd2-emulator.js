const { Server } = require('socket.io');
const io = new Server(8081, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

console.log('OBD2 Emulator running on port 8081');

io.on('connection', (socket) => {
  console.log('OBD2 client connected:', socket.id);

  // Emit realistic vehicle telemetry every 1 second
  const interval = setInterval(() => {
    socket.emit('telemetry', {
      timestamp: new Date().toISOString(),
      speed: Math.floor(Math.random() * 80) + 20,
      rpm: Math.floor(Math.random() * 3000) + 1000,
      fuelLevel: Math.floor(Math.random() * 100),
      engineTemp: Math.floor(Math.random() * 40) + 80,
      odometer: Math.floor(Math.random() * 100000),
      batteryVoltage: (Math.random() * 2 + 12).toFixed(1),
      engineLoad: Math.floor(Math.random() * 100),
      throttlePosition: Math.floor(Math.random() * 100),
      coolantTemp: Math.floor(Math.random() * 40) + 80,
      airIntakeTemp: Math.floor(Math.random() * 30) + 20,
      maf: (Math.random() * 50 + 10).toFixed(2),
      shortTermFuelTrim: (Math.random() * 10 - 5).toFixed(1),
      longTermFuelTrim: (Math.random() * 10 - 5).toFixed(1)
    });
  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('OBD2 client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('OBD2 socket error:', error);
  });
});

io.on('error', (error) => {
  console.error('OBD2 server error:', error);
});
