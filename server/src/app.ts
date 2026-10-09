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

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp();
