import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import listingsRouter from './routes/listings.js';
import dashboardRouter from './routes/dashboard.js';
import ordersRouter from './routes/orders.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
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

app.listen(env.port, () => {
  console.log(`Server is listening on http://localhost:${env.port}`);
});
