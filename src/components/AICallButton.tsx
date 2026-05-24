import { useState } from "react";
import { Phone } from "lucide-react";
import { AICallOverlay } from "./AICallOverlay";

export function AICallButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Call AI tutor"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
          boxShadow: "0 10px 30px -8px hsl(var(--primary) / 0.6), 0 0 0 1px hsl(var(--border))",
        }}
      >
        <Phone className="h-6 w-6" />
      </button>
      {open && <AICallOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
