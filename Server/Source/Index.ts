import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLanguageCorpus, SupportedLang } from './API/Language.js';
import { getChessLevels, getAllPuzzles, getPuzzleByFen } from './API/Chess.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Expose pre-built static assets
app.use('/assets/corpus', express.static(path.join(__dirname, '../Asset/Corpus')));

/**
 * Language Corpus Routing Pipeline
 */
app.get('/api/language-corpus', (req: Request, res: Response): void => {
  const lang = req.query.lang as SupportedLang;
  if (!lang) {
    res.status(400).json({ error: "Missing required query parameter: 'lang'." });
    return;
  }
  try {
    res.json(getLanguageCorpus(lang));
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Chess Corpus Core Routing API
 * GET /api/chess-corpus
 */
app.get('/api/chess-corpus', (req: Request, res: Response): void => {
  try {
    const levels = getChessLevels();
    const puzzles = getAllPuzzles();
    res.json({ levels, puzzles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Chess Puzzle Lookup by FEN Identifier
 * GET /api/chess-puzzle?fen=...
 */
app.get('/api/chess-puzzle', (req: Request, res: Response): void => {
  const fen = req.query.fen as string;
  if (!fen) {
    res.status(400).json({ error: "Missing required query parameter: 'fen'." });
    return;
  }
  try {
    const puzzle = getPuzzleByFen(fen);
    if (!puzzle) {
      res.status(404).json({ error: `Puzzle with FEN '${fen}' not found.` });
      return;
    }
    res.json(puzzle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Production engine active at: http://localhost:${PORT}`);
  console.log(`   - Chess API Index: http://localhost:${PORT}/api/chess-corpus`);
});