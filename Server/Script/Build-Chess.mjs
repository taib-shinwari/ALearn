import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LESSON_DIR = path.join(__dirname, '../Data/Chess/Lesson');
const PUZZLE_DIR = path.join(__dirname, '../Data/Chess/Puzzle');
const OUTPUT_FILE = path.join(__dirname, '../Asset/Corpus/Chess.json');

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

const chessCorpus = {
  lessons: {},
  puzzles: {}
};

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.warn(`[WARN] Directory does not exist: ${dir}`);
    return fileList;
  }
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

// Track statistics for debugging
let lessonStats = { found: 0, matched: 0, skipped: 0 };
let puzzleStats = { found: 0, processed: 0 };

console.log("🔍 Scanning for Chess Lessons...");
const lessonFiles = walkDir(LESSON_DIR);
lessonStats.found = lessonFiles.length;

lessonFiles.forEach(fp => {
  const cleanPath = fp.replace(/\\/g, "/");
  const match = cleanPath.match(/\/Lesson\/([^/]+)\/([^/]+)\/(?:The-)?([^/]+)\.json$/i);
  
  if (!match) {
    console.warn(`  [SKIP - Regex Mismatch] ${cleanPath}`);
    lessonStats.skipped++;
    return;
  }

  const categoryId  = match[1].toLowerCase();
  const subcatId    = match[2].toLowerCase();
  const lessonId    = match[3].toLowerCase();

  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));

    if (!chessCorpus.lessons[categoryId]) chessCorpus.lessons[categoryId] = {};
    if (!chessCorpus.lessons[categoryId][subcatId]) chessCorpus.lessons[categoryId][subcatId] = [];

    chessCorpus.lessons[categoryId][subcatId].push({
      id: lessonId,
      steps: [data]
    });

    lessonStats.matched++;
  } catch (err) {
    console.error(`  [ERROR - JSON Parse Failed] ${cleanPath}: ${err.message}`);
    lessonStats.skipped++;
  }
});

console.log("\n🔍 Scanning for Chess Puzzles...");
if (fs.existsSync(PUZZLE_DIR)) {
  const puzzleFiles = fs.readdirSync(PUZZLE_DIR).filter(f => f.endsWith('.json'));
  puzzleStats.found = puzzleFiles.length;

  puzzleFiles.forEach(file => {
    const filePath = path.join(PUZZLE_DIR, file);
    try {
      const fenKey = path.basename(file, '.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      chessCorpus.puzzles[fenKey] = data;
      puzzleStats.processed++;
    } catch (err) {
      console.error(`  [ERROR - JSON Parse Failed] ${filePath}: ${err.message}`);
    }
  });
} else {
  console.warn(`[WARN] Puzzle directory does not exist: ${PUZZLE_DIR}`);
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chessCorpus, null, 2), 'utf-8');

// Summary Report
console.log("\n--- 📊 Corpus Build Summary ---");
console.log(`Lessons Found:   ${lessonStats.found}`);
console.log(`Lessons Parsed:  ${lessonStats.matched}`);
console.log(`Lessons Skipped: ${lessonStats.skipped}`);
console.log(`Puzzles Found:   ${puzzleStats.found}`);
console.log(`Puzzles Parsed:  ${puzzleStats.processed}`);
console.log(`--------------------------------`);
console.log(`✓ Built Chess Corpus successfully to ${OUTPUT_FILE}`);