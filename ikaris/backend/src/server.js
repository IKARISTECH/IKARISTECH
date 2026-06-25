require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ IKARIS API corriendo en puerto ${PORT}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  console.error('❌ Error levantando servidor:', err);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});