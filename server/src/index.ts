import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import { env } from './config/env.js';
import { migrate } from './db/migrate.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import listingsRouter from './routes/listings.js';
import dashboardRouter from './routes/dashboard.js';
import ordersRouter from './routes/orders.js';

const app = express();

// Render pune un proxy în fața serverului; fără asta limitarea încercărilor ar vedea toți utilizatorii ca pe o singură adresă IP.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(env.corsOrigins.length > 0 ? { origin: env.corsOrigins } : undefined));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    message: 'Agro B2B API is running',
    environment: env.nodeEnv,
  });
});

app.get('/api/roles', (_req, res) => {
  res.json({
    roles: ['seller', 'distributor', 'admin'],
  });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/orders', ordersRouter);

migrate()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Server is listening on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Database migration failed:', error);
    process.exit(1);
  });
