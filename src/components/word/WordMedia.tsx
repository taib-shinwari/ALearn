import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { fetchWordImage } from "@/lib/wordImage";
import { WordLang } from "@/data/courseData";
import { cn } from "@/lib/utils";

interface Props {
  word: string;
  lang: WordLang;
}

/**
 * Bare-bones media helpers for a word:
 *  - TTS: browser SpeechSynthesis (only when available)
 *  - STT: Web Speech API (only when available; shows transcript + match)
 *  - Image: Wikipedia thumbnail (only rendered if one is found)
 */
export function WordMedia({ word, lang }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [match, setMatch] = useState<null | boolean>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    setTranscript(""); setMatch(null); setImgUrl(null);
    let cancelled = false;
    fetchWordImage(word, lang).then(url => {
      if (!cancelled) setImgUrl(url);
    });
    return () => { cancelled = true; };
  }, [word, lang]);

  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const sttAvailable = !!SR;
  const ttsAvailable = isSpeechAvailable();
  const showActions = ttsAvailable || sttAvailable;

  const toggleListen = () => {
    if (!SR) return;
    if (listening) { recRef.current?.stop?.(); return; }
    const rec = new SR();
    rec.lang = lang === "nl" ? "nl-NL" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript || "";
      setTranscript(text);
      setMatch(text.trim().toLowerCase() === word.trim().toLowerCase());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setTranscript(""); setMatch(null); setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  return (
    <div className="mt-4 space-y-3">
      {showActions && (
        <div className="flex items-center justify-center gap-2">
          {ttsAvailable && (
            <Button size="icon" onClick={() => speak(word, lang)} aria-label="Play">
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
          {sttAvailable && (
            <Button
              size="icon"
              active={listening}
              onClick={toggleListen}
              aria-label="Speak"
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
        </div>
      )}

      {transcript && (
        <Container className={cn("text-sm text-center", match === false && "border-destructive")}>
          <span className="opacity-60 mr-1">You said:</span>
          <span className="font-medium">{transcript}</span>
          {match === true && <span className="ml-2">✓</span>}
          {match === false && <span className="ml-2">✗</span>}
        </Container>
      )}

      {imgUrl && (
        <div className="rounded-[24px] overflow-hidden border-2 border-foreground bg-background aspect-[4/3] flex items-center justify-center">
          <img
            src={imgUrl}
            alt={word}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgUrl(null)}
          />
        </div>
      )}
    </div>
  );
}
