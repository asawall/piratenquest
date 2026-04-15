import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static React build
app.use(express.static(join(__dirname, 'dist')));

// In-memory game store (sufficient for 2-player sessions)
const games = new Map();

// Cleanup old games every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, g] of games) {
    if (now - g._lastUpdate > 24 * 60 * 60 * 1000) games.delete(id);
  }
}, 60 * 60 * 1000);

// API Routes
app.post('/api/games', (req, res) => {
  const game = req.body;
  if (!game?.id) return res.status(400).json({ error: 'No game ID' });
  game._lastUpdate = Date.now();
  games.set(game.id, game);
  res.json({ ok: true, id: game.id });
});

app.get('/api/games/:id', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

app.put('/api/games/:id', (req, res) => {
  const game = req.body;
  game._lastUpdate = Date.now();
  games.set(req.params.id, game);
  res.json({ ok: true });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏴‍☠️ PiratenQuest server running on port ${PORT}`);
});
