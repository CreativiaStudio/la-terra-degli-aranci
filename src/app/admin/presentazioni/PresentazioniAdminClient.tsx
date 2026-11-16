"use client";

import React, { useState, useMemo } from "react";
import { Presentation, PresentationSlide } from "@/lib/presentazioni";
import { PresentationAnalyticsState, SlugAnalytics } from "@/lib/presentazioniCloud";

interface PresentazioniAdminClientProps {
  initialPresentations: Presentation[];
  initialAnalytics: PresentationAnalyticsState;
}

const PUBLIC_BASE = "https://ecosistema.laterradegliaranci.it";

function formatDateIt(iso: string | null | undefined): string {
  if (!iso) return "Mai";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PresentazioniAdminClient({
  initialPresentations,
  initialAnalytics,
}: PresentazioniAdminClientProps) {
  const [presentations, setPresentations] = useState<Presentation[]>(initialPresentations);
  const [analytics, setAnalytics] = useState<PresentationAnalyticsState>(initialAnalytics);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Stato Editor Modale (Bottega Noce)
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<Presentation | null>(null);
  const [uploadingSlides, setUploadingSlides] = useState(false);
  const [savingManifest, setSavingManifest] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const kpi = useMemo(() => {
    const entries = Object.values(analytics.bySlug || {});
    const qrTotal = entries.reduce((acc, s) => acc + (s.qrScansTotal || 0), 0);
    const qrUnique = entries.reduce((acc, s) => acc + (s.qrScansUnique || 0), 0);
    const directTotal = entries.reduce((acc, s) => acc + (s.directViewsTotal || 0), 0);
    return {
      qrTotal,
      qrUnique,
      directTotal,
      activeCount: presentations.length,
    };
  }, [analytics, presentations.length]);

  const handleRefreshStats = async () => {
    setRefreshingStats(true);
    try {
      const res = await fetch("/api/presentazioni/track", { cache: "no-store" });
      const data = await res.json();
      if (data?.success && data.analytics) {
        setAnalytics(data.analytics);
        showToast("Statistiche aggiornate!");
      }
    } catch {
      showToast("Errore aggiornamento statistiche");
    } finally {
      setRefreshingStats(false);
    }
  };

  const handleCopyQrLink = async (slug: string) => {
    const url =
      slug === "hub"
        ? `${PUBLIC_BASE}/presentazioni?src=qr`
        : `${PUBLIC_BASE}/presentazioni/${slug}?src=qr`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link con tracking QR copiato!");
    } catch {
      showToast("Impossibile copiare automaticamente");
    }
  };

  const openEditor = (p: Presentation) => {
    setEditingSlug(p.slug);
    setDraft(JSON.parse(JSON.stringify(p)));
  };

  const closeEditor = () => {
    setEditingSlug(null);
    setDraft(null);
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.slides.length) return;
    const nextSlides = [...draft.slides];
    const [moved] = nextSlides.splice(index, 1);
    nextSlides.splice(target, 0, moved);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, id: idx + 1 }));
    setDraft({
      ...draft,
      slides: reindexed,
      totalSlides: reindexed.length,
      coverImage: reindexed[0]?.imageUrl || draft.coverImage,
    });
  };

  const removeSlide = (index: number) => {
    if (!draft) return;
    if (draft.slides.length <= 1) {
      showToast("Deve rimanere almeno 1 slide nella presentazione.");
      return;
    }
    const nextSlides = draft.slides
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, id: idx + 1 }));
    setDraft({
      ...draft,
      slides: nextSlides,
      totalSlides: nextSlides.length,
      coverImage: nextSlides[0]?.imageUrl || draft.coverImage,
    });
  };

  const handleUploadSlides = async (files: FileList | null) => {
    if (!files || files.length === 0 || !draft) return;
    setUploadingSlides(true);
    try {
      const added: PresentationSlide[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("slug", draft.slug);

        const res = await fetch("/api/admin/presentazioni/upload-slide", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (data?.success && data.url) {
          const nextNum = draft.slides.length + added.length + 1;
          added.push({
            id: nextNum,
            title: `Slide ${nextNum}`,
            imageUrl: data.url,
          });
        }
      }

      if (added.length > 0) {
        const merged = [...draft.slides, ...added].map((s, idx) => ({ ...s, id: idx + 1 }));
        setDraft({
          ...draft,
          slides: merged,
          totalSlides: merged.length,
          coverImage: merged[0]?.imageUrl || draft.coverImage,
        });
        showToast(`${added.length} slide caricate su Cloudflare R2!`);
      }
    } catch {
      showToast("Errore durante il caricamento su R2");
    } finally {
      setUploadingSlides(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draft || !editingSlug) return;
    setSavingManifest(true);
    try {
      const updatedList = presentations.map((p) => (p.slug === editingSlug ? draft : p));
      const res = await fetch("/api/admin/presentazioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentations: updatedList }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.presentations)) {
        setPresentations(data.presentations);
        closeEditor();
        showToast("Presentazione salvata e pubblicata su R2!");
      } else {
        showToast(data?.error || "Errore durante il salvataggio");
      }
    } catch {
      showToast("Errore di rete durante il salvataggio");
    } finally {
      setSavingManifest(false);
    }
  };

  const getStatsFor = (slug: string): SlugAnalytics =>
    analytics.bySlug?.[slug] || {
      qrScansTotal: 0,
      qrScansUnique: 0,
      directViewsTotal: 0,
      directViewsUnique: 0,
      lastScanAt: null,
    };

  const slugTitleMap = useMemo(() => {
    const map: Record<string, string> = { hub: "Hub Tutte le Presentazioni" };
    for (const p of presentations) map[p.slug] = p.title;
    return map;
  }, [presentations]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", color: "#242220" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#242220" }}>
            🎞️ Presentazioni Ufficiali &amp; QR Code
          </h1>
          <p style={{ margin: 0, color: "#6e6a63", fontSize: "0.95rem" }}>
            Gestione slide e testi per <strong>Bottega Noce</strong> • Statistiche scansioni e stampa QR brandizzati per{" "}
            <strong>Roberto Sola</strong>.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a
            href="/presentazioni"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "10px",
              border: "1px solid #dfd8ce",
              background: "#ffffff",
              color: "#242220",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: 600,
            }}
          >
            🌐 Apri Hub Pubblico
          </a>
          <button
            type="button"
            onClick={handleRefreshStats}
            disabled={refreshingStats}
            style={{
              padding: "0.6rem 1.1rem",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
              color: "#ffffff",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: refreshingStats ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(229,140,44,0.28)",
            }}
          >
            {refreshingStats ? "⏳ Aggiornamento..." : "🔄 Aggiorna Statistiche"}
          </button>
        </div>
      </div>

      {/* KPI Top Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Scansioni QR Uniche", value: kpi.qrUnique, sub: "Dispositivi distinti da preventivi", color: "#e58c2c" },
          { label: "Scansioni QR Totali", value: kpi.qrTotal, sub: "Totale aperture via QR Code", color: "#8c6a28" },
          { label: "Aperture Link Diretti", value: kpi.directTotal, sub: "Da WhatsApp, sito o email", color: "#2d5a27" },
          { label: "Presentazioni Attive", value: kpi.activeCount, sub: "Ospitate su Cloudflare R2", color: "#242220" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#ffffff",
              border: "1px solid #ece7e0",
              borderRadius: "14px",
              padding: "1.15rem 1.3rem",
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "#6e6a63", fontWeight: 600, marginBottom: "0.35rem" }}>
              {card.label}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: card.color, lineHeight: 1.1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: "0.76rem", color: "#8e8880", marginTop: "0.35rem" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Lista Presentazioni + Hub QR */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {/* Card Hub Centrale */}
        {(() => {
          const hubStats = getStatsFor("hub");
          return (
            <div
              style={{
                background: "linear-gradient(135deg, #fffdf9 0%, #f6f1e7 100%)",
                border: "1px solid rgba(197,160,89,0.45)",
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1.25rem",
              }}
            >
              <div style={{ flex: "1 1 320px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#8c6a28",
                    background: "rgba(197,160,89,0.18)",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    marginBottom: "0.5rem",
                  }}
                >
                  QR Generale • Tutte le 4 Presentazioni
                </span>
                <h2 style={{ margin: "0 0 0.3rem 0", fontSize: "1.2rem", fontWeight: 700 }}>
                  Hub di Smistamento (/presentazioni)
                </h2>
                <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.86rem", color: "#66625b" }}>
                  Porta il cliente alla pagina con tutti i 4 format. Ideale per brochure generiche o accoglienza in villa.
                </p>
                <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                  <span>📱 QR Uniche: <strong>{hubStats.qrScansUnique}</strong></span>
                  <span>🔁 QR Totali: <strong>{hubStats.qrScansTotal}</strong></span>
                  <span>🔗 Link Diretti: <strong>{hubStats.directViewsTotal}</strong></span>
                  <span style={{ color: "#8e8880" }}>Ultima: {formatDateIt(hubStats.lastScanAt)}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <img
                  src="/api/admin/presentazioni/qr?slug=hub&format=png&size=360"
                  alt="QR Code Hub Presentazioni"
                  width={116}
                  height={116}
                  style={{ borderRadius: "10px", border: "1px solid #e6dfd5", background: "#fff" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <a
                    href="/api/admin/presentazioni/qr?slug=hub&format=png&download=1"
                    style={btnPrimarySmall}
                  >
                    ⬇️ Scarica PNG Stampa
                  </a>
                  <a
                    href="/api/admin/presentazioni/qr?slug=hub&format=svg&download=1"
                    style={btnSecondarySmall}
                  >
                    ⬇️ Scarica SVG Vettoriale
                  </a>
                  <button type="button" onClick={() => handleCopyQrLink("hub")} style={btnGhostSmall}>
                    📋 Copia Link Tracking
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Le 4 Presentazioni Specifiche */}
        {presentations.map((p) => {
          const stats = getStatsFor(p.slug);
          return (
            <div
              key={p.slug}
              style={{
                background: "#ffffff",
                border: "1px solid #ece7e0",
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1.5rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              {/* Cover + Info + Stats */}
              <div style={{ display: "flex", gap: "1.25rem", flex: "1 1 460px", flexWrap: "wrap", alignItems: "center" }}>
                <div
                  style={{
                    width: "180px",
                    aspectRatio: "16 / 9",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1px solid #ece7e0",
                    background: "#efeae1",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ flex: "1 1 250px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    {p.badge && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#8c6a28",
                          background: "#f7f1e3",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {p.badge}
                      </span>
                    )}
                    <span style={{ fontSize: "0.78rem", color: "#8e8880", fontWeight: 600 }}>
                      {p.slides.length} slide
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.15rem", fontWeight: 700 }}>{p.title}</h3>
                  <p style={{ margin: "0 0 0.7rem 0", fontSize: "0.85rem", color: "#66625b" }}>{p.subtitle}</p>

                  {/* Stats Pill Row */}
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                      fontSize: "0.82rem",
                      padding: "0.45rem 0.75rem",
                      background: "#faf8f5",
                      borderRadius: "8px",
                      border: "1px solid #f0ebe3",
                    }}
                  >
                    <span>
                      📱 QR Uniche: <strong style={{ color: "#e58c2c" }}>{stats.qrScansUnique}</strong>
                    </span>
                    <span>
                      🔁 QR Totali: <strong>{stats.qrScansTotal}</strong>
                    </span>
                    <span>
                      🔗 Diretti: <strong>{stats.directViewsTotal}</strong>
                    </span>
                    <span style={{ color: "#8e8880" }}>Ultima: {formatDateIt(stats.lastScanAt)}</span>
                  </div>
                </div>
              </div>

              {/* QR Preview + Azioni */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <img
                  src={`/api/admin/presentazioni/qr?slug=${encodeURIComponent(p.slug)}&format=png&size=360`}
                  alt={`QR Code ${p.title}`}
                  width={124}
                  height={124}
                  style={{ borderRadius: "10px", border: "1px solid #e6dfd5", background: "#fff" }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", minWidth: "175px" }}>
                  <a
                    href={`/api/admin/presentazioni/qr?slug=${encodeURIComponent(p.slug)}&format=png&download=1`}
                    style={btnPrimarySmall}
                  >
                    ⬇️ Scarica PNG Stampa
                  </a>
                  <a
                    href={`/api/admin/presentazioni/qr?slug=${encodeURIComponent(p.slug)}&format=svg&download=1`}
                    style={btnSecondarySmall}
                  >
                    ⬇️ Scarica SVG Vettoriale
                  </a>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={() => openEditor(p)}
                      style={{ ...btnGhostSmall, flex: 1, background: "#fff7ed", borderColor: "#f4d0a4", color: "#b45309" }}
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyQrLink(p.slug)}
                      style={btnGhostSmall}
                      title="Copia link con tracking QR"
                    >
                      📋
                    </button>
                    <a
                      href={`/presentazioni/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={btnGhostSmall}
                      title="Apri presentazione"
                    >
                      🔗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabella Ultime Scansioni */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ece7e0",
          borderRadius: "16px",
          padding: "1.35rem 1.5rem",
          boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
        }}
      >
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 700 }}>
          📊 Ultime Scansioni QR &amp; Aperture
        </h2>
        {!analytics.recentEvents || analytics.recentEvents.length === 0 ? (
          <p style={{ margin: 0, color: "#8e8880", fontSize: "0.9rem" }}>
            Nessuna scansione registrata finora. Appena un cliente inquadra un QR Code dai preventivi apparirà qui in tempo reale.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ece7e0", textAlign: "left", color: "#6e6a63" }}>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Data / Ora</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Presentazione</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Sorgente</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Dispositivo</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentEvents.slice(0, 30).map((ev, idx) => (
                  <tr key={`${ev.timestamp}-${idx}`} style={{ borderBottom: "1px solid #f5f2ed" }}>
                    <td style={{ padding: "0.55rem 0.5rem", whiteSpace: "nowrap" }}>{formatDateIt(ev.timestamp)}</td>
                    <td style={{ padding: "0.55rem 0.5rem", fontWeight: 600 }}>
                      {slugTitleMap[ev.slug] || ev.slug}
                    </td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>
                      {ev.source === "qr" ? (
                        <span style={{ color: "#b45309", fontWeight: 700 }}>📱 QR Code</span>
                      ) : (
                        <span style={{ color: "#2d5a27" }}>🔗 Link Diretto</span>
                      )}
                    </td>
                    <td style={{ padding: "0.55rem 0.5rem", color: "#66625b" }}>{ev.device}</td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>
                      {ev.isUnique ? (
                        <span
                          style={{
                            background: "#ecfdf5",
                            color: "#047857",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          Nuova
                        </span>
                      ) : (
                        <span style={{ color: "#8e8880", fontSize: "0.78rem" }}>Ritorno</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale Editor Presentazione (Bottega Noce) */}
      {draft && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 18, 15, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "980px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
            }}
          >
            {/* Header Modale */}
            <div
              style={{
                padding: "1.15rem 1.5rem",
                borderBottom: "1px solid #ece7e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#faf8f5",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                  ✏️ Modifica Presentazione — {draft.slug}
                </h2>
                <span style={{ fontSize: "0.8rem", color: "#6e6a63" }}>
                  Le modifiche alle slide vengono ottimizzate in WebP 2K su Cloudflare R2.
                </span>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                style={{
                  background: "none",
                  border: "1px solid #dfd8ce",
                  borderRadius: "8px",
                  padding: "0.35rem 0.7rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ✕ Chiudi
              </button>
            </div>

            {/* Body Scrollabile */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <label style={labelStyle}>Titolo</label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Badge Categoria</label>
                  <input
                    type="text"
                    value={draft.badge || ""}
                    onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Sottotitolo</label>
                  <input
                    type="text"
                    value={draft.subtitle}
                    onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Descrizione (SEO &amp; Anteprima)</label>
                  <textarea
                    rows={2}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
              </div>

              {/* Gestione Slide */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                  Slide ({draft.slides.length})
                </h3>
                <label
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    background: uploadingSlides ? "#d6d0c7" : "#2d5a27",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: uploadingSlides ? "wait" : "pointer",
                  }}
                >
                  {uploadingSlides ? "⏳ Caricamento su R2..." : "➕ Carica Nuove Slide (PNG / JPG / WebP)"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingSlides}
                    onChange={(e) => handleUploadSlides(e.target.files)}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                {draft.slides.map((slide, idx) => (
                  <div
                    key={`${slide.imageUrl}-${idx}`}
                    style={{
                      border: "1px solid #ece7e0",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#faf8f5",
                    }}
                  >
                    <div style={{ aspectRatio: "16 / 9", background: "#18191b" }}>
                      <img
                        src={slide.imageUrl}
                        alt={`Slide ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <div
                      style={{
                        padding: "0.45rem 0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>#{idx + 1}</span>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          onClick={() => moveSlide(idx, -1)}
                          disabled={idx === 0}
                          style={miniIconBtn}
                          title="Sposta indietro"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlide(idx, 1)}
                          disabled={idx === draft.slides.length - 1}
                          style={miniIconBtn}
                          title="Sposta avanti"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlide(idx)}
                          style={{ ...miniIconBtn, color: "#b91c1c" }}
                          title="Rimuovi slide"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modale */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #ece7e0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                background: "#faf8f5",
              }}
            >
              <button type="button" onClick={closeEditor} style={btnSecondarySmall}>
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingManifest || uploadingSlides}
                style={{
                  ...btnPrimarySmall,
                  border: "none",
                  cursor: savingManifest ? "wait" : "pointer",
                  padding: "0.55rem 1.25rem",
                }}
              >
                {savingManifest ? "⏳ Salvataggio..." : "💾 Salva e Pubblica"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#1e1b18",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "12px",
            fontSize: "0.9rem",
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            border: "1px solid #c5a059",
            zIndex: 3000,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

const btnPrimarySmall: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.35rem",
  padding: "0.48rem 0.85rem",
  borderRadius: "8px",
  background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "0.82rem",
  fontWeight: 600,
  textAlign: "center",
};

const btnSecondarySmall: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.35rem",
  padding: "0.45rem 0.85rem",
  borderRadius: "8px",
  background: "#ffffff",
  border: "1px solid #dfd8ce",
  color: "#242220",
  textDecoration: "none",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
};

const btnGhostSmall: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.4rem 0.65rem",
  borderRadius: "8px",
  background: "#faf8f5",
  border: "1px solid #e6dfd5",
  color: "#242220",
  textDecoration: "none",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#514d48",
  marginBottom: "0.3rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #dfd8ce",
  fontSize: "0.9rem",
  color: "#242220",
  boxSizing: "border-box",
};

const miniIconBtn: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfd8ce",
  borderRadius: "5px",
  padding: "0.15rem 0.4rem",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
};
