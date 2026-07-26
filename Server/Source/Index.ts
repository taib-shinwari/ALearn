import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';
import cors from 'cors'; 
import { getLanguageCorpus, SupportedLang } from './API/Language.js';
import { getChessLevels, getAllPuzzles, getPuzzleByFen } from './API/Chess.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Enable CORS middleware to allow requests from your frontend codespace port
app.use(cors({
  origin: "https://organic-space-guacamole-5gpjqpg7xgqrc4j55-8080.app.github.dev",
  credentials: true
}));

// Expose pre-built static assets
app.use('/assets/corpus', express.static(path.join(__dirname, '../Asset/Corpus')));

/**
 * Language Corpus Routing Pipeline
 * Returns the full, nested dictionary tree including sections, categories, subcategories, and words.
 */
app.get('/api/language-corpus', (req: Request, res: Response): void => {
  const lang = req.query.lang as SupportedLang;
  if (!lang) {
    res.status(400).json({ error: "Missing required query parameter: 'lang'." });
    return;
  }
  
  // Convert shorthand codes ('en', 'nl') back to full names if needed
  const codeToNameMap: Record<string, string> = {
    nl: "Dutch",
    en: "English",
    ar: "Arabic",
    ps: "Pashto"
  };
  
  const fullLangName = codeToNameMap[lang] || lang;

  try {
    res.json(getLanguageCorpus(fullLangName as SupportedLang));
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Chess Corpus Routing Pipeline
 * Returns all lesson levels and puzzle keys available in the pre-compiled database.
 */
app.get('/api/chess-corpus', (_req: Request, res: Response): void => {
  try {
    const levels = getChessLevels();
    const puzzles = getAllPuzzles();
    res.json({ levels, puzzles });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load chess corpus." });
  }
});

/**
 * Chess Puzzle Payload Pipeline
 * Returns specific puzzle details given a FEN query param.
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
    res.status(500).json({ error: err.message || "Failed to retrieve puzzle." });
  }
});

// Helperfunctie om het Network IP-adres op te halen
function getNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

app.listen(PORT, () => {
  const networkIp = getNetworkIp();

  const cyan = '\x1b[36m';
  const bold = '\x1b[1m';
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  console.log(`\n  ${cyan}➜${reset}  ${bold}Local:${reset}   ${cyan}http://localhost:\x1b[1m${PORT}\x1b[22m/${reset}`);
  console.log(`  ${cyan}➜${reset}  ${bold}Network:${reset} ${dim}http://${networkIp}:\x1b[1m${PORT}\x1b[22m/${reset}\n`);
});