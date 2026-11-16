"use client";

import { useEffect, useRef } from "react";

export default function PresentationTracker({ slug }: { slug: string }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const srcParam = (params.get("src") || params.get("utm_source") || "").toLowerCase();
      const source: "qr" | "direct" = srcParam.startsWith("qr") ? "qr" : "direct";

      const storageKey = `tda_pres_seen_${slug}_${source}`;
      const alreadySeen = window.sessionStorage?.getItem(storageKey) === "1";

      if (!alreadySeen) {
        try {
          window.sessionStorage?.setItem(storageKey, "1");
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
