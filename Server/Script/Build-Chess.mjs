import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LESSON_DIR = path.join(__dirname, '../Source/Data/Chess/Lesson');
const PUZZLE_DIR = path.join(__dirname, '../Source/Data/Chess/Puzzle');
const OUTPUT_FILE = path.join(__dirname, '../Asset/Corpus/Chess.json');

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

const chessCorpus = {
  lessons: {},
  puzzles: {}
};

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walkDir(p, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(p);
    }
  }
  return fileList;
}

// Parse Lessons
const lessonFiles = walkDir(LESSON_DIR);
lessonFiles.forEach(fp => {
  const cleanPath = fp.replace(/\\/g, "/");
  const match = cleanPath.match(/\/Lesson\/([^/]+)\/([^/]+)\/(?:The-)?([^/]+)\.json$/i);
  if (!match) return;

  const categoryId  = match[1].toLowerCase();
  const subcatId    = match[2].toLowerCase();
  const lessonId    = match[3].toLowerCase();
  const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));

  if (!chessCorpus.lessons[categoryId]) chessCorpus.lessons[categoryId] = {};
  if (!chessCorpus.lessons[categoryId][subcatId]) chessCorpus.lessons[categoryId][subcatId] = [];

  chessCorpus.lessons[categoryId][subcatId].push({
    id: lessonId,
    steps: [data]
  });
});

// Parse Puzzles
if (fs.existsSync(PUZZLE_DIR)) {
  const puzzleFiles = fs.readdirSync(PUZZLE_DIR).filter(f => f.endsWith('.json'));
  puzzleFiles.forEach(file => {
    const fenKey = path.basename(file, '.json');
    const data = JSON.parse(fs.readFileSync(path.join(PUZZLE_DIR, file), 'utf-8'));
    chessCorpus.puzzles[fenKey] = data;
  });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chessCorpus, null, 2), 'utf-8');
console.log(`✓ Built Chess Corpus successfully.`);