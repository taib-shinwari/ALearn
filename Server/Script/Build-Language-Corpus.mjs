import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../Data/Language');
const INT_DIR = path.join(__dirname, '../Data/Internationalization'); // Adjust if moved inside Source
const OUTPUT_DIR = path.join(__dirname, '../Asset/Corpus/Language');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SUPPORTED_LANGS = ["Dutch", "English", "Arabic", "Pashto"];

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

SUPPORTED_LANGS.forEach(lang => {
  const corpus = {
    vocabularyGrammar: {},
    arabicAlphabet: {},
    lessons: {},
    labels: {}
  };

  // 1. Scan Raw Lesson and Section Data
  const langPath = path.join(DATA_DIR, lang);
  const files = walkDir(langPath);

  files.forEach(filePath => {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const cleanPath = filePath.replace(/\\/g, '/');

    // Arabic Alphabet parsing fallback hook
    if (lang === 'Arabic' && cleanPath.includes('/Alphabet/')) {
      const idx = path.basename(filePath, '.json');
      corpus.arabicAlphabet[idx] = data;
      return;
    }

    // Lesson Files
    const lessonMatch = cleanPath.match(/\/Lessons\/([^/]+)\/([^/]+)\.json$/);
    if (lessonMatch) {
      const [, level, lessonSlug] = lessonMatch;
      if (!corpus.lessons[level]) corpus.lessons[level] = {};
      corpus.lessons[level][lessonSlug] = {
        slug: lessonSlug,
        steps: Array.isArray(data) ? data : [data]
      };
      return;
    }

    // Standard Categories & Subcategories
    const afterLangMatch = cleanPath.split('/Language/' + lang + '/')[1];
    if (afterLangMatch) {
      const segments = afterLangMatch.split('/');
      if (segments.length >= 3) {
        const section = segments[0];
        const category = segments[1];
        let subcategory = "Default";
        let fileName = segments[2];

        if (segments.length === 4) {
          subcategory = segments[2];
          fileName = segments[3];
        }

        const wordSlug = path.basename(fileName, '.json');

        if (!corpus.vocabularyGrammar[section]) corpus.vocabularyGrammar[section] = {};
        if (!corpus.vocabularyGrammar[section][category]) corpus.vocabularyGrammar[section][category] = {};
        if (!corpus.vocabularyGrammar[section][category][subcategory]) corpus.vocabularyGrammar[section][category][subcategory] = {};

        corpus.vocabularyGrammar[section][category][subcategory][wordSlug] = data;
      }
    }
  });

  // 2. Scan Translations/Labels mapping for language
  const labelPath = path.join(INT_DIR, lang, 'labels.json');
  if (fs.existsSync(labelPath)) {
    corpus.labels = JSON.parse(fs.readFileSync(labelPath, 'utf-8'));
  }

  // Write finalized clean language bundle
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${lang}.json`), 
    JSON.stringify(corpus, null, 2), 
    'utf-8'
  );
  console.log(`✓ Built Language Corpus for: ${lang}`);
});