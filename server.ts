import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './server/services/db.service';
import apiRouter from './server/routes/api.routes';
import { errorHandler } from './server/middleware/error.middleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Initialize JSON database with seed data if files do not exist
initDatabase();

app.use(express.json({ limit: '10mb' }));

// Mount all modular API routes
app.use('/api', apiRouter);

// Serve frontend assets
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Dev mode: use Vite dev server as middleware
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// Global centralized error handler
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`UrbanIQ Full-Stack Server running at http://0.0.0.0:${port}`);
});
