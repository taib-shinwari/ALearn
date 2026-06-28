import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Direct import from your TypeScript file path
import { chessLevels } from './Server/Data/chessData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Capitalizes the first letter of a string or words separated by hyphens.
 */
function capitalizeString(str) {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

/**
 * Helper to generate a basic mini-FEN string based on the piece and square.
 * This ensures the frontend receives a valid "FEN" element at Index 0.
 */
function generateMiniFen(piece) {
  // Simple fallback representation if complex setup is handled elsewhere
  return `${piece.square}-${piece.type}`;
}

function generateLessonFiles() {
  try {
    chessLevels.forEach((level) => {
      const levelFolder = capitalizeString(level.id);

      if (!level.groups || level.groups.length === 0) {
        return;
      }

      level.groups.forEach((group) => {
        const subcategoryFolder = capitalizeString(group.id);
        const targetDir = path.join(__dirname, 'Server', 'Data', 'Chess', 'Lesson', levelFolder, subcategoryFolder);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        group.lessons.forEach((lesson) => {
          const fileName = `The-${capitalizeString(lesson.id)}.json`;
          const finalPath = path.join(targetDir, fileName);

          // 1. FEN setup
          const fenData = generateMiniFen(lesson.piece);

          // 2. Solutions compilation (Comma separated path string)
          // Uses stars sequence as the moves path, or defaults to square if random
          const solutionPath = lesson.stars ? lesson.stars.join(',') : lesson.piece.square;
          const formattedSolutions = `["${solutionPath}"]`;

          // 3. Translation ID
          const translationId = `lesson.${lesson.id}.intro`;

          // Construct the strict raw text representation exactly as requested
          let fileContent = '[\n';
          fileContent += ` "${fenData}",\n`;
          fileContent += ` ${formattedSolutions},\n`;
          fileContent += ` "${translationId}"\n`;
          fileContent += ']';

          fs.writeFileSync(finalPath, fileContent, 'utf-8');
          console.log(`✅ Generated Lesson: ${levelFolder}/${subcategoryFolder}/${fileName}`);
        });
      });
    });

    console.log('\n🚀 Lesson files updated to new architectural data layout!');
  } catch (error) {
    console.error('❌ Error generating lesson files:', error);
  }
}

generateLessonFiles();