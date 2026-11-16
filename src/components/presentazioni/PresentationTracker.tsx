"use client";

import { useEffect, useRef } from "react";

export default function PresentationTracker({ slug }: { slug: string }) {
  const trackedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || trackedSlugRef.current === slug) return;
    trackedSlugRef.current = slug;

    try {
      const params = new URLSearchParams(window.location.search);
      const srcParam = (params.get("src") || params.get("utm_source") || "").toLowerCase();
      const source: "qr" | "direct" = srcParam.startsWith("qr") ? "qr" : "direct";

      const storageKey = `tda_pres_seen_${slug}_${source}`;
      let alreadySeen = false;
      try {
        alreadySeen = window.localStorage?.getItem(storageKey) === "1";
        if (!alreadySeen) {
          window.localStorage?.setItem(storageKey, "1");
        }
      } catch {
        try {
          alreadySeen = window.sessionStorage?.getItem(storageKey) === "1";
          if (!alreadySeen) {
            window.sessionStorage?.setItem(storageKey, "1");
          }
        } catch {
          // ignore storage errors
        }
      }

      fetch("/api/presentazioni/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          source,
          isUnique: !alreadySeen,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [slug]);

  return null;
}
