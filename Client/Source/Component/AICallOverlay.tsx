import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { supabase } from "Client/Integration/supabase/client";
import { cn } from "@/Library/utils";

type Msg = { role: "user" | "assistant"; content: string };

const BCP47: Record<string, string> = { en: "en-US", nl: "nl-NL", ar: "ar-SA" };

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefix = BCP47[lang]?.split("-")[0] ?? lang;
  return voices.find(v => v.lang.toLowerCase().startsWith(prefix)) || null;
}

export function AICallOverlay({ onClose }: { onClose: () => void }) {
  const { targetLang, uiLang, t } = useCourseLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const supported = !!SR && typeof window !== "undefined" && !!window.speechSynthesis;

  // Warm-up voices list (some browsers populate it asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
  }, []);

  // Cleanup on close
  useEffect(() => () => {
    try { recRef.current?.stop?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const speakOut = (text: string) =>
    new Promise<void>(resolve => {
      if (!window.speechSynthesis) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = BCP47[targetLang] || "en-US";
      const v = pickVoice(targetLang);
      if (v) u.voice = v;
      u.onend = () => { setSpeaking(false); resolve(); };
      u.onerror = () => { setSpeaking(false); resolve(); };
      setSpeaking(true);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });

  const sendToAI = async (history: Msg[]) => {
    setThinking(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ai-tutor", {
        body: { messages: history, targetLang, uiLang },
      });
      if (fnErr) throw fnErr;
      if ((data as any)?.error) throw new Error((data as any).error);
      const reply: string = (data as any)?.reply ?? "";
      if (reply) {
        const next: Msg = { role: "assistant", content: reply };
        setMessages(m => [...m, next]);
        setCaption(reply);
        await speakOut(reply);
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setThinking(false);
    }
  };

  const toggleMic = () => {
    if (!SR) return;
    if (listening) { try { recRef.current?.stop?.(); } catch {} return; }
    try { window.speechSynthesis?.cancel(); } catch {}
    const rec = new SR();
    rec.lang = BCP47[targetLang] || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      setCaption(text);
      if (e.results[e.results.length - 1].isFinal && text.trim()) {
        const userMsg: Msg = { role: "user", content: text.trim() };
        const next = [...messages, userMsg];
        setMessages(next);
        sendToAI(next);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e?.error && e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Mic error: ${e.error}`);
      }
    };
    recRef.current = rec;
    setCaption("");
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  // Greet once the overlay mounts
  useEffect(() => {
    const greet: Msg = {
      role: "user",
      content: `Start the conversation by greeting me in ${targetLang} and asking what I want to practise today. Keep it to one short sentence.`,
    };
    sendToAI([greet]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = () => {
    try { recRef.current?.stop?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between"
         style={{ background: "radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.15), hsl(var(--background)))" }}>
      <div className="w-full sticky top-0 z-10 bg-background/95 backdrop-blur border-b-2 border-border px-4 py-3">
        <h2 className="text-base font-semibold text-center">
          {uiLang === "nl" ? "AI-gesprek" : uiLang === "ar" ? "مكالمة الذكاء" : "AI Call"}
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center mt-1">
          {(targetLang || "en").toUpperCase()} · {uiLang === "nl" ? "Live" : uiLang === "ar" ? "مباشر" : "Live"}
        </p>
      </div>


      {/* Animated orb */}
      <div className="flex flex-col items-center gap-6">
        <div
          className={cn(
            "h-48 w-48 rounded-full transition-transform",
            (listening || speaking || thinking) && "scale-110",
          )}
          style={{
            background: "radial-gradient(circle at 35% 30%, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.4) 60%, transparent 75%)",
            boxShadow: speaking
              ? "0 0 80px 10px hsl(var(--primary) / 0.5)"
              : listening
              ? "0 0 60px 6px hsl(var(--accent) / 0.5)"
              : "0 0 40px 4px hsl(var(--primary) / 0.25)",
            animation: speaking
              ? "pulse 1.2s ease-in-out infinite"
              : listening
              ? "pulse 1.6s ease-in-out infinite"
              : "none",
          }}
        />
        <div className="max-w-md text-center min-h-[3rem]">
          {thinking ? (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {uiLang === "nl" ? "Denken…" : uiLang === "ar" ? "يفكر…" : "Thinking…"}
            </p>
          ) : (
            <p className="text-base leading-relaxed">{caption || (uiLang === "nl" ? "Tik op de microfoon en spreek" : uiLang === "ar" ? "اضغط على الميكروفون وتحدث" : "Tap the mic and start speaking")}</p>
          )}
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 pb-4">
        <button
          type="button"
          onClick={toggleMic}
          disabled={!supported || thinking || speaking}
          aria-label="microphone"
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center transition-all",
            "glass-card",
            listening ? "ring-2 ring-destructive" : "ring-1 ring-border",
            !supported && "opacity-40 cursor-not-allowed",
          )}
        >
          {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button
          type="button"
          onClick={endCall}
          aria-label="end call"
          className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>

      {!supported && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Voice features need a browser with Web Speech API (Chrome / Edge / Safari).
        </p>
      )}
    </div>
  );
}
