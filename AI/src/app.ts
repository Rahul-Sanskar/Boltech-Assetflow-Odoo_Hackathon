import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { jsonRepair } from './utils/jsonRepair';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import aiRouter from './routes/ai.routes';
import maintenanceRouter from './routes/maintenance.routes';
import { loadConfig } from './config/validation';
import { ProviderFactory } from './providers/ProviderFactory';
import { logger } from './utils/logger';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
  }

  public async initialize(): Promise<void> {
    const config = loadConfig();
    logger.level = config.LOG_LEVEL;
    ProviderFactory.getInstance().initializeOpenRouter(
      config.OPENROUTER_API_KEY,
      config.OPENROUTER_BASE_URL,
      config.DEFAULT_MODEL
    );

    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(
      rateLimit({
        windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
        max: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10),
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
    this.app.use(express.json({ reviver: jsonRepair, limit: config.MAX_REQUEST_SIZE }));
    this.app.use(requestLogger);
    this.app.use('/health', healthRouter);
    this.app.use('/api/ai', aiRouter);
    this.app.use('/api', maintenanceRouter);
    this.app.use(errorHandler);
    this.app.use((req, res) => {
      res.status(404).json({ success: false, data: null, metadata: {}, processingTime: 0, requestId: '' });
    });
  }
}
