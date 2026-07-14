import { useEffect, useMemo, useState } from "react";
import { Volume2, Check, X as XIcon, Repeat, Ear, Layers3, BookOpen } from "lucide-react";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { TitleBar } from "@/Component/UI/title-bar";
import { cn } from "@/Library/utils";
import { speak, isSpeechAvailable } from "@/Component/Practice/speech";
import type { Lang } from "@/Library/wordTypes";

/**
 * Activity picker that wraps the original alphabet viewer.
 * - English (and other latin-script langs): Listen & Write + Memory Match.
 * - Other languages: viewer only (caller renders).
 */

type Mode = "viewer" | "listen" | "match";

const LABELS: Record<Lang, { viewer: string; listen: string; match: string; pick: string }> = {
  en: { viewer: "Browse", listen: "Listen & Write", match: "Match Pairs", pick: "Activity" },
  nl: { viewer: "Bladeren", listen: "Luister & Schrijf", match: "Kaartjes Matchen", pick: "Activiteit" },
  ar: { viewer: "تصفح", listen: "استمع واكتب", match: "طابق البطاقات", pick: "النشاط" },
};

export function AlphabetActivityPicker({
  targetLang,
  uiLang,
  mode,
  setMode,
  showInteractive,
}: {
  targetLang: Lang;
  uiLang: Lang;
  mode: Mode;
  setMode: (m: Mode) => void;
  showInteractive: boolean;
}) {
  const L = LABELS[uiLang] ?? LABELS.en;
  return (
    <div className="px-4 mb-3">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setMode("viewer")} active={mode === "viewer"}>
          <BookOpen className="h-4 w-4 mr-1.5" /> {L.viewer}
        </Button>
        {showInteractive && (
          <>
            <Button onClick={() => setMode("listen")} active={mode === "listen"}>
              <Ear className="h-4 w-4 mr-1.5" /> {L.listen}
            </Button>
            <Button onClick={() => setMode("match")} active={mode === "match"}>
              <Layers3 className="h-4 w-4 mr-1.5" /> {L.match}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export type AlphabetMode = Mode;

/* ───────────────────────── Listen & Write ───────────────────────── */

function getEnglishLetters(): string[] {
  return "abcdefghijklmnopqrstuvwxyz".split("");
}

export function ListenAndWrite({ targetLang, uiLang }: { targetLang: Lang; uiLang: Lang }) {
  const letters = useMemo(() => getEnglishLetters(), []);
  const [order, setOrder] = useState<string[]>(() => shuffle(letters));
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<"none" | "ok" | "no">("none");
  const [correct, setCorrect] = useState(0);
  const target = order[idx];
  const total = order.length;

  const playLetter = (l = target) => speak(l, targetLang === "ar" ? "ar" : targetLang === "nl" ? "nl" : "en");

  useEffect(() => {
    if (target) {
      const t = window.setTimeout(() => playLetter(target), 250);
      return () => window.clearTimeout(t);
    }
  }, [target]);

  const check = () => {
    if (!value) return;
    if (value.trim().toLowerCase() === target.toLowerCase()) {
      setVerdict("ok");
      setCorrect(c => c + 1);
      window.setTimeout(next, 600);
    } else {
      setVerdict("no");
    }
  };

  const next = () => {
    setValue("");
    setVerdict("none");
    setIdx(i => i + 1);
  };

  const restart = () => {
    setOrder(shuffle(letters));
    setIdx(0);
    setValue("");
    setVerdict("none");
    setCorrect(0);
  };

  if (idx >= total) {
    return (
      <div className="px-4 max-w-md mx-auto py-8">
        <Container className="p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">
            {uiLang === "nl" ? "Klaar!" : uiLang === "ar" ? "اكتمل!" : "All done!"}
          </h2>
          <p className="text-sm opacity-70">{correct} / {total}</p>
          <Button active fullWidth onClick={restart}>
            <Repeat className="h-4 w-4 mr-2" />
            {uiLang === "nl" ? "Opnieuw" : uiLang === "ar" ? "إعادة" : "Play again"}
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-md mx-auto space-y-4">
      <TitleBar>
        <span className="font-semibold">{idx + 1} / {total}</span>
      </TitleBar>
      <Container className="p-6 flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-wider opacity-60">
          {uiLang === "nl" ? "Luister en schrijf de letter" : uiLang === "ar" ? "استمع واكتب الحرف" : "Listen and type the letter"}
        </p>
        <Button onClick={() => playLetter()} aria-label="Play" className="h-16 w-16 rounded-full">
          <Volume2 className="h-6 w-6" />
        </Button>
        <input
          autoFocus
          maxLength={2}
          value={value}
          onChange={(e) => { setValue(e.target.value); if (verdict !== "none") setVerdict("none"); }}
          onKeyDown={(e) => { if (e.key === "Enter") (verdict === "no" ? next() : check()); }}
          className={cn(
            "w-24 h-24 text-center text-5xl font-bold uppercase rounded-[14px] border-2 outline-none transition-colors",
            verdict === "none" && "border-border bg-background",
            verdict === "ok" && "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            verdict === "no" && "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400",
          )}
          aria-label="Letter input"
        />
        {verdict === "no" && (
          <p className="text-sm">
            <span className="opacity-60">
              {uiLang === "nl" ? "Juist antwoord: " : uiLang === "ar" ? "الإجابة: " : "Answer: "}
            </span>
            <span className="font-bold uppercase">{target}</span>
          </p>
        )}
      </Container>
      <div className="flex gap-2">
        <Button onClick={() => playLetter()} fullWidth>
          <Volume2 className="h-4 w-4 mr-2" />
          {uiLang === "nl" ? "Opnieuw afspelen" : uiLang === "ar" ? "أعد التشغيل" : "Replay"}
        </Button>
        {verdict === "no" ? (
          <Button active fullWidth onClick={next}>
            {uiLang === "nl" ? "Volgende" : uiLang === "ar" ? "التالي" : "Next"}
          </Button>
        ) : (
          <Button active disabled={!value} fullWidth onClick={check}>
            <Check className="h-4 w-4 mr-2" />
            {uiLang === "nl" ? "Controleren" : uiLang === "ar" ? "تحقق" : "Check"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Match Pairs ───────────────────────── */

interface Card { id: string; letter: string; pairKey: string; flipped: boolean; matched: boolean }

export function MatchPairs({ targetLang, uiLang }: { targetLang: Lang; uiLang: Lang }) {
  const ROUND_PAIRS = 8;
  const letters = useMemo(() => getEnglishLetters(), []);
  const buildDeck = (): Card[] => {
    const picked = shuffle(letters).slice(0, ROUND_PAIRS);
    const cards: Card[] = [];
    picked.forEach((l, i) => {
      cards.push({ id: `${l}-U-${i}`, letter: l.toUpperCase(), pairKey: l, flipped: false, matched: false });
      cards.push({ id: `${l}-L-${i}`, letter: l.toLowerCase(), pairKey: l, flipped: false, matched: false });
    });
    return shuffle(cards);
  };
  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const allMatched = deck.every(c => c.matched);

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    setMoves(m => m + 1);
    if (deck[a].pairKey === deck[b].pairKey) {
      const t = window.setTimeout(() => {
        setDeck(prev => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setPicked([]);
      }, 350);
      return () => window.clearTimeout(t);
    } else {
      const t = window.setTimeout(() => {
        setDeck(prev => prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
        setPicked([]);
      }, 800);
      return () => window.clearTimeout(t);
    }
  }, [picked, deck]);

  const flip = (i: number) => {
    if (picked.length >= 2) return;
    if (deck[i].flipped || deck[i].matched) return;
    setDeck(prev => prev.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicked(p => [...p, i]);
  };

  const restart = () => { setDeck(buildDeck()); setPicked([]); setMoves(0); };

  return (
    <div className="px-4 max-w-md mx-auto space-y-3">
      <TitleBar>
        <span className="flex items-center justify-between w-full">
          <span>{uiLang === "nl" ? "Match hoofdletter & kleine letter" : uiLang === "ar" ? "طابق الحرف الكبير والصغير" : "Match upper & lower case"}</span>
          <span className="font-mono opacity-70">{moves}</span>
        </span>
      </TitleBar>
      <div className="grid grid-cols-4 gap-2">
        {deck.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            disabled={c.matched || c.flipped}
            aria-label={c.flipped || c.matched ? c.letter : "Hidden card"}
            className={cn(
              "aspect-square rounded-[14px] border-2 flex items-center justify-center text-3xl font-bold transition-all select-none",
              c.matched && "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              c.flipped && !c.matched && "border-foreground bg-muted",
              !c.flipped && !c.matched && "border-border bg-background hover:bg-muted text-transparent",
            )}
          >
            {c.flipped || c.matched ? c.letter : "?"}
          </button>
        ))}
      </div>
      {allMatched && (
        <Container className="p-4 text-center space-y-3 border-emerald-500/60 bg-emerald-500/5">
          <p className="font-semibold">
            {uiLang === "nl" ? "Allemaal gevonden!" : uiLang === "ar" ? "وجدت جميع الأزواج!" : "All pairs found!"}
          </p>
          <p className="text-xs opacity-70">{moves} {uiLang === "nl" ? "zetten" : uiLang === "ar" ? "محاولات" : "moves"}</p>
          <Button active fullWidth onClick={restart}>
            <Repeat className="h-4 w-4 mr-2" />
            {uiLang === "nl" ? "Opnieuw" : uiLang === "ar" ? "إعادة" : "Play again"}
          </Button>
        </Container>
      )}
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}