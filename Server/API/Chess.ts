import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';

const router: Router = express.Router();

// Define base paths to our generated flat data structures
const LESSON_BASE_DIR = path.join(process.cwd(), 'Server', 'Data', 'Chess', 'Lesson');
const PUZZLE_BASE_DIR = path.join(process.cwd(), 'Server', 'Data', 'Chess', 'Puzzle');

/**
 * Helper utility to safely capitalize strings matching your generated file tree system.
 * Example: "learn-to-play" -> "Learn-To-Play"
 */
function capitalizeParam(str: string): string {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

// ── LESSON API ENDPOINTS ─────────────────────────────────────────────

/**
 * GET /api/chess/lesson/:category/:subcategory/:lessonId
 * Fetches a specific highly optimized lesson array.
 * Example: /api/chess/lesson/beginner/learn-to-play/king
 */
router.get('/lesson/:category/:subcategory/:lessonId', (req: Request, res: Response): void => {
  try {
    const { category, subcategory, lessonId } = req.params;

    // Enforce folder casing conventions established by our generator
    const capitalizedCategory = capitalizeParam(category);
    const capitalizedSubcategory = capitalizeParam(subcategory);
    const capitalizedFileName = `The-${capitalizeParam(lessonId)}.json`;

    const targetFilePath = path.join(
      LESSON_BASE_DIR,
      capitalizedCategory,
      capitalizedSubcategory,
      capitalizedFileName
    );

    // Guard rail: Verify file existence before reading
    if (!fs.existsSync(targetFilePath)) {
      res.status(404).json({ error: `Lesson not found at specified path configuration.` });
      return;
    }

    const rawData = fs.readFileSync(targetFilePath, 'utf-8');
    
    // Parse and return the custom structural index array directly
    const lessonArray = JSON.parse(rawData);
    res.json(lessonArray);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error processing lesson data.' });
  }
});

// ── PUZZLE API ENDPOINTS ─────────────────────────────────────────────

/**
 * GET /api/chess/puzzles
 * Scans the flat puzzle directory and provides a roster list of all available puzzle filenames (FEN tokens).
 */
router.get('/puzzles', (_req: Request, res: Response): void => {
  try {
    if (!fs.existsSync(PUZZLE_BASE_DIR)) {
      res.json([]);
      return;
    }

    const files = fs.readdirSync(PUZZLE_BASE_DIR);
    
    // Filter down to JSON files and strip extensions to reveal the clean, usable FEN string names
    const activePuzzles = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    res.json({ puzzles: activePuzzles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to inventory puzzle resources.' });
  }
});

/**
 * GET /api/chess/puzzle/:fenName
 * Resolves a specific puzzle's validated pathways using its sanitized FEN string filename.
 * Example: /api/chess/puzzle/6k1-5ppp-8-8-8-8-8-R6K-w----0-1
 */
router.get('/puzzle/:fenName', (req: Request, res: Response): void => {
  try {
    const { fenName } = req.params;
    const targetFilePath = path.join(PUZZLE_BASE_DIR, `${fenName}.json`);

    if (!fs.existsSync(targetFilePath)) {
      res.status(404).json({ error: 'Requested chess tactical setup could not be found.' });
      return;
    }

    const rawData = fs.readFileSync(targetFilePath, 'utf-8');
    const puzzleArray = JSON.parse(rawData);
    
    res.json(puzzleArray);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error processing puzzle solutions.' });
  }
});

export default router;