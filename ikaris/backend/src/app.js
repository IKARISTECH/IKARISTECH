const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Seguridad
app.use(helmet());

// Rate limit global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta en 15 minutos.',
  },
});

app.use(globalLimiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-empresa-id'],
}));

// Parseo JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logs
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health checks
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'IKARIS API corriendo',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'IKARIS API corriendo',
    timestamp: new Date().toISOString(),
  });
});

// ─── RUTAS ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/layout',    require('./routes/layout'));
app.use('/api/tareas',    require('./routes/tareas'));
app.use('/api/clientes',   require('./routes/clientes'));
app.use('/api/usuarios',   require('./routes/usuarios'));
app.use('/api/calendario',  require('./routes/calendario'));
app.use('/api/formularios', require('./routes/formularios'));
app.use('/api/perfil',    require('./routes/perfil'));


// Manejo global de errores
app.use(errorHandler);

module.exports = app;