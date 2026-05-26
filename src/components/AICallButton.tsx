import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AICallOverlay } from "./AICallOverlay";

/**
 * Inline "Call AI" button. Sits next to the Practice button on the root.
 */
export function AICallButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Call AI tutor"
      >
        <Phone className="h-5 w-5" />
      </Button>
      {open && <AICallOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
