import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type SupportedLang   = "Dutch" | "English" | "Arabic" | "Pashto";
export type I18nLang        = "Dutch" | "English" | "Arabic";

// Read corpus file dynamically on request instead of bundler imports
export function getLanguageCorpus(lang: SupportedLang): any {
  const corpusPath = path.join(__dirname, `../../Asset/Corpus/Language/${lang}.json`);
  if (!fs.existsSync(corpusPath)) {
    throw new Error(`Corpus for language ${lang} not found. Run compiler script.`);
  }
  return JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
}