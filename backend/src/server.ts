import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS configuration - allow frontend origin in production
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [];
    
    // Also allow Railway domains if no FRONTEND_URL is set
    if (allowedOrigins.length === 0 && origin.includes('.railway.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (for local/filesystem storage)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
console.log(`[Server] Static file serving configured:`);
console.log(`  Upload directory: ${uploadDir}`);
console.log(`  Serving at: /uploads`);
app.use('/uploads', express.static(uploadDir));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'EFX LED Shop API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/square/products',
      orders: '/api/orders',
      drivers: '/api/drivers',
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    cors: {
      frontendUrl: process.env.FRONTEND_URL || 'not set',
      nodeEnv: process.env.NODE_ENV || 'development',
    }
  });
});

// API routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import squareRoutes from './routes/square.js';
import orderRoutes from './routes/orders.js';
import driverRoutes from './routes/drivers.js';
import photoRoutes from './routes/photos.js';
import pointsRoutes from './routes/points.js';
import leaderboardRoutes from './routes/leaderboard.js';
import pointsShopRoutes from './routes/points-shop.js';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/square', squareRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/points-shop', pointsShopRoutes);

// Admin routes
import adminRoutes from './routes/admin.js';
app.use('/api/admin', adminRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

