import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth';
import metricsRoutes from './routes/metrics';
import ticketsRoutes from './routes/tickets';
import policiesRoutes from './routes/policies';
import reportsRoutes from './routes/reports';
import { AlertService } from './services/alertService';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', authenticate, metricsRoutes);
app.use('/api/tickets', authenticate, ticketsRoutes);
app.use('/api/policies', authenticate, policiesRoutes);
app.use('/api/reports', authenticate, reportsRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start Alert Service
const alertService = AlertService.getInstance();
alertService.startRiskCheckInterval();

// Server startup
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
