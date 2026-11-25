import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import courseRoutes from './modules/courses/routes.js';
import enrollmentRoutes from './modules/enrollments/routes.js';
import authRoutes from './modules/auth/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import adminAuthRoutes from './modules/admin-auth/routes.js';
import adminWorkspaceRoutes from './modules/admin-workspace/routes.js';
import { adminRouter as adminPlatformRoutes, publicRouter as platformContentRoutes, supportRouter } from './modules/admin-platform/routes.js';
import { handleRazorpayWebhook } from './modules/payments/controller.js';

const app = express();
app.set('trust proxy', 1);

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = new Set([
  ...parseAllowedOrigins(process.env.CORS_ORIGINS),
  ...parseAllowedOrigins(process.env.FRONTEND_ORIGIN),
  ...parseAllowedOrigins(process.env.ADMIN_APP_URL),
  ...parseAllowedOrigins(process.env.LEARNER_APP_URL),
  ...parseAllowedOrigins(process.env.VITE_LEARNER_SITE_URL),
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (!['http:', 'https:'].includes(protocol)) return false;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname === 'scstrainingacademy.com' || hostname.endsWith('.scstrainingacademy.com')) return true;
    if (hostname === 'scstrainingacademy.netlify.app' || hostname.endsWith('--scstrainingacademy.netlify.app')) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'skillpath-backend' });
});
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/admin', adminWorkspaceRoutes);
app.use('/api/admin/platform', adminPlatformRoutes);
app.use('/api/platform', platformContentRoutes);
app.use('/api/support', supportRouter);
app.use('/api/payments', paymentRoutes);

app.use((error, _request, response, _next) => {
  if (error.name === 'MulterError') {
    const item = error.field === 'avatar' ? 'Profile photo' : error.field === 'image' ? 'Course cover' : 'Resume';
    const size = error.field === 'avatar' ? '2 MB' : '5 MB';
    return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? `${item} must be smaller than ${size}.` : `${item} upload was rejected.` });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return response.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'An unexpected server error occurred.' });
});

export default app;
