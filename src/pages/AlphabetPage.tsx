import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { Lang } from "@/data/courseData";

interface AlphabetTable {
  vowelsLabel: { nl: string; en: string; ar: string };
  consonantsLabel: { nl: string; en: string; ar: string };
  vowels: { letter: string; name?: string }[];
  consonants: { letter: string; name?: string }[];
}

const TABLES: Record<Lang, AlphabetTable> = {
  nl: {
    vowelsLabel: { nl: "Klinkers", en: "Vowels", ar: "حروف العلة" },
    consonantsLabel: { nl: "Medeklinkers", en: "Consonants", ar: "الحروف الساكنة" },
    vowels: ["a", "e", "i", "o", "u", "y"].map(l => ({ letter: l.toUpperCase() })),
    consonants: "bcdfghjklmnpqrstvwxz".split("").map(l => ({ letter: l.toUpperCase() })),
  },
  en: {
    vowelsLabel: { nl: "Klinkers", en: "Vowels", ar: "حروف العلة" },
    consonantsLabel: { nl: "Medeklinkers", en: "Consonants", ar: "الحروف الساكنة" },
    vowels: ["a", "e", "i", "o", "u"].map(l => ({ letter: l.toUpperCase() })),
    consonants: "bcdfghjklmnpqrstvwxyz".split("").map(l => ({ letter: l.toUpperCase() })),
  },
  ar: {
    vowelsLabel: { nl: "Lange klinkers", en: "Long vowels", ar: "حروف المد" },
    consonantsLabel: { nl: "Medeklinkers", en: "Consonants", ar: "الحروف الساكنة" },
    vowels: [
      { letter: "ا", name: "alif" },
      { letter: "و", name: "waw" },
      { letter: "ي", name: "ya" },
    ],
    consonants: [
      ["ب", "ba"], ["ت", "ta"], ["ث", "tha"], ["ج", "jim"], ["ح", "ha"], ["خ", "kha"],
      ["د", "dal"], ["ذ", "dhal"], ["ر", "ra"], ["ز", "zay"], ["س", "sin"], ["ش", "shin"],
      ["ص", "sad"], ["ض", "dad"], ["ط", "ta"], ["ظ", "za"], ["ع", "ayn"], ["غ", "ghayn"],
      ["ف", "fa"], ["ق", "qaf"], ["ك", "kaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"],
      ["ه", "ha"], ["ء", "hamza"],
    ].map(([letter, name]) => ({ letter, name })),
  },
};

function LetterCard({ letter, name, lang }: { letter: string; name?: string; lang: Lang }) {
  const canSpeak = isSpeechAvailable();
  return (
    <Container className="p-3 flex flex-col items-center justify-center gap-1 aspect-square">
      <span className="text-2xl font-bold leading-none">{letter}</span>
      {name && <span className="text-[10px] opacity-60">{name}</span>}
      {canSpeak && (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => speak(letter, lang)}>
          <Volume2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </Container>
  );
}

export default function AlphabetPage() {
  const { targetLang, uiLang } = useCourseLanguage();
  const table = TABLES[targetLang] ?? TABLES.en;

  const loc = (o: { nl: string; en: string; ar: string }) => o[uiLang] || o.en;

  return (
    <div className="px-6 max-w-2xl mx-auto w-full space-y-6">
      <section className="space-y-3">
        <TitleBar className="font-semibold">{loc(table.vowelsLabel)}</TitleBar>
        <div className="grid grid-cols-6 gap-2">
          {table.vowels.map(v => (
            <LetterCard key={v.letter} letter={v.letter} name={v.name} lang={targetLang} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <TitleBar className="font-semibold">{loc(table.consonantsLabel)}</TitleBar>
        <div className="grid grid-cols-6 gap-2">
          {table.consonants.map(c => (
            <LetterCard key={c.letter} letter={c.letter} name={c.name} lang={targetLang} />
          ))}
        </div>
      </section>
    </div>
  );
}
