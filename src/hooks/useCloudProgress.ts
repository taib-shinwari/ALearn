// Lazy cloud sync for path progress + reviews. Falls back to localStorage
// when there's no Supabase session (the app still uses a demo login today),
// so this hook becomes effective the moment real auth lands.

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewState } from "@/lib/spacedRepetition";
import type { LessonProgressEntry } from "@/context/AppContext";

interface Payload {
  pathProgress: Record<string, LessonProgressEntry>;
  reviews: ReviewState[];
}

export function useCloudProgress(
  payload: Payload,
  onHydrate: (p: Payload) => void,
) {
  const hydrated = useRef(false);

  // Hydrate once on mount if a real Supabase session exists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const { data } = await supabase
        .from("user_progress" as never)
        .select("path_progress, reviews")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled || !data) { hydrated.current = true; return; }
      const row = data as unknown as { path_progress: Record<string, LessonProgressEntry>; reviews: ReviewState[] };
      onHydrate({ pathProgress: row.path_progress ?? {}, reviews: row.reviews ?? [] });
      hydrated.current = true;
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced upsert on changes
  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from("user_progress" as never).upsert({
        user_id: session.user.id,
        path_progress: payload.pathProgress,
        reviews: payload.reviews,
      } as never);
    }, 1500);
    return () => clearTimeout(t);
  }, [payload.pathProgress, payload.reviews]);
}
