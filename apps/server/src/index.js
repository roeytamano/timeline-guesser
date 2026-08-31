import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import questionRoutes from './routes/questions.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ ok: true, status: 'Timeline Guesser server is live' });
});

app.use('/api/questions', questionRoutes);

async function bootstrapDatabase() {
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');

  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('Database schema loaded successfully.');
  } catch (error) {
    console.warn('Database unavailable or schema not loaded yet; continuing with fallback data:', error.message);
  }
}

async function startServer() {
  await bootstrapDatabase();

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
