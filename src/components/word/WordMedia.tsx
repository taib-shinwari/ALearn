import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, MicOff, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { WordLang } from "@/data/courseData";
import { cn } from "@/lib/utils";

interface Props {
  word: string;
  lang: WordLang;
}

/**
 * Bare-bones media helpers for a word:
 *  - TTS: browser SpeechSynthesis
 *  - STT: Web Speech API (mic button, shows transcript + match indicator)
 *  - Image: Unsplash source URL keyed off the word (no API key needed)
 */
export function WordMedia({ word, lang }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [match, setMatch] = useState<null | boolean>(null);
  const [imgError, setImgError] = useState(false);
  const recRef = useRef<any>(null);

  // Reset on word change
  useEffect(() => {
    setTranscript(""); setMatch(null); setImgError(false);
  }, [word]);

  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const sttAvailable = !!SR;

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

  const imgUrl = `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(word)}`;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-center gap-2">
        {isSpeechAvailable() && (
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

      {transcript && (
        <Container className={cn("text-sm text-center", match === false && "border-destructive")}>
          <span className="opacity-60 mr-1">You said:</span>
          <span className="font-medium">{transcript}</span>
          {match === true && <span className="ml-2">✓</span>}
          {match === false && <span className="ml-2">✗</span>}
        </Container>
      )}

      {!imgError && (
        <div className="rounded-[24px] overflow-hidden border-2 border-black bg-white aspect-[4/3] flex items-center justify-center">
          <img
            src={imgUrl}
            alt={word}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      {imgError && (
        <Container className="text-xs text-center opacity-60 flex items-center justify-center gap-2">
          <ImageIcon className="h-4 w-4" /> No image
        </Container>
      )}
    </div>
  );
}
