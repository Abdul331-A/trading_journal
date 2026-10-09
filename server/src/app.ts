import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProd } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error';

export function createApp() {
  const app = express();
  const origins = env.CLIENT_URL.split(',').map((s) => s.trim());

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  if (!isProd) app.use(morgan('dev'));

  // Base URL:  GET /
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'API is running successfully',
    });
  });

  // API root:  GET /api   (must be BEFORE app.use('/api', routes))
  app.get('/api', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'API is running successfully',
    });
  });

  // Health check:  GET /health  (for uptime monitors / nginx / PM2 checks)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp();