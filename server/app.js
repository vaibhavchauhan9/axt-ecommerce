// File: /server/app.js
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Core Utilities & Handlers
import AppError from './utils/appError.js';
import { globalErrorHandler } from './middleware/errorMiddleware.js';

// Application Domain Routing Matrices
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';
import productRouter from './routes/productRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import cartRouter from './routes/cartRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import webhookRouter from './routes/webhookRoutes.js';
import adminRouter from './routes/adminRoutes.js';

const app = express();

// 1. Dynamic Security Headers (Helmet Architecture)
app.use(helmet());

// 2. Dev-friendly logging configurations 
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 3. Brute Force Throttling Filters
const coreLimiter = rateLimit({
  max: 150, // Limit each client target IP matrix to 150 requests per window cycle
  windowMs: 15 * 60 * 1000, // 15-minute verification timeline
  message: 'Too many operational requests from this host footprint. Retry operational loops in 15 minutes.',
});
app.use('/api', coreLimiter);

// 4. Managed CORS Policy
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 5. CRITICAL PAYMENT WEBHOOK REQUIREMENT:
// Webhooks must be mounted BEFORE standard body parsing logic so the raw cryptographic signatures remain intact.
app.use('/api/v1/webhooks', webhookRouter);

// 6. High-volume JSON/URL parsers with size limit constraints
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Cryptographic Cookie Processing Node
app.use(cookieParser());

// 8. NoSQL Injection Mitigation Engine
app.use(mongoSanitize());

// 9. Base Infrastructure Diagnosis Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AXT Production Engine online and functional.',
    timestamp: new Date().toISOString(),
  });
});

// 10. Active Domain Router Mounting Layers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/admin', adminRouter);

// 11. Unhandled Route Capturer Engine (Catches anything not matched by mounted routers)
app.all('*', (req, res, next) => {
  next(new AppError(`Requested infrastructure endpoint URL context [${req.originalUrl}] not located.`, 404));
});

// 12. Centralized Failure Middleware Orchestrator
app.use(globalErrorHandler);

export default app;