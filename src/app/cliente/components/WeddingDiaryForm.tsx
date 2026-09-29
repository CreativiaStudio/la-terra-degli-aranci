"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveWeddingDiaryAction } from "../actions";
import {
  WEDDING_DIARY_SECTIONS,
  WEDDING_DIARY_FIELD_COUNT,
  computeDiaryProgress,
  isDiaryFieldFilled,
  type WeddingDiaryField,
} from "./weddingDiaryFields";

type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

interface WeddingDiaryProps {
  clientId: string;
  quoteId?: string;
  initialData?: any;
  lang?: "it" | "en";
  isReadOnly?: boolean;
  /** Notifica il genitore della percentuale di completamento (0-100). */
  onProgressChange?: (pct: number) => void;
}

/** Debounce per i campi testuali: l'utente non deve mai premere "Invio". */
const TEXT_DEBOUNCE_MS = 600;
const DRAFT_PREFIX = "tda_wedding_diary_draft_";

/** Estrae un oggetto answers pulito da un eventuale record Wedding Diary. */
function normalizeAnswers(initialData: any): Record<string, any> {
  const base = initialData && typeof initialData === "object" ? initialData.answers : null;
  if (!base || typeof base !== "object") return {};
  const clean: Record<string, any> = {};
  Object.entries(base as Record<string, any>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") clean[key] = value;
  });
  return clean;
}

export default function WeddingDiaryForm({
  clientId,
  quoteId,
  initialData,
  lang = "it",
  isReadOnly = false,
  onProgressChange,
}: WeddingDiaryProps) {
  const isEng = lang === "en";
  const storageKey = `${DRAFT_PREFIX}${clientId || "anon"}`;

  const [answers, setAnswers] = useState<Record<string, any>>(() => normalizeAnswers(initialData));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialData?.updated_at || null);
  const [draftRestored, setDraftRestored] = useState(false);

  const answersRef = useRef<Record<string, any>>(answers);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);
  const textTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    isReadOnly
      ? Object.fromEntries(WEDDING_DIARY_SECTIONS.map((s) => [s.id, true]))
      : Object.fromEntries(WEDDING_DIARY_SECTIONS.map((s, i) => [s.id, i === 0]))
  );

  /* ------------------------------------------------------------------ *
   * Progresso di completamento
   * ------------------------------------------------------------------ */
  const progress = useMemo(() => computeDiaryProgress(answers), [answers]);
  const filledBySection = useMemo(
    () =>
      Object.fromEntries(
        WEDDING_DIARY_SECTIONS.map((section) => [
          section.id,
          section.fields.filter((f) => isDiaryFieldFilled(answers[f.name])).length,
        ])
      ) as Record<string, number>,
    [answers]
  );

  useEffect(() => {
    onProgressChange?.(progress);
  }, [progress, onProgressChange]);

  /* ------------------------------------------------------------------ *
   * Persistenza: localStorage (fallback offline) + Server Action
   * ------------------------------------------------------------------ */
  const writeDraft = useCallback(
    (payload: Record<string, any>, pending: boolean) => {
      pendingRef.current = pending;
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ answers: payload, pending, updated_at: new Date().toISOString() })
        );
      } catch {
        // localStorage non disponibile (private mode): si prosegue online
      }
    },
    [storageKey]
  );

  const persist = useCallback(
    async (payload: Record<string, any>, opts?: { silent?: boolean }) => {
      if (isReadOnly) return;
      writeDraft(payload, true);
      if (!opts?.silent) setSaveState("saving");
      try {
        const res = await saveWeddingDiaryAction({
          client_id: clientId,
          quote_id: quoteId,
          answers: payload,
          completion_rate: computeDiaryProgress(payload),
        });
        if (!mountedRef.current) return;
        if (res?.success) {
          const serverTs = (res.data && res.data.updated_at) || new Date().toISOString();
          setLastSavedAt(serverTs);
          // Se nel frattempo sono arrivate nuove modifiche, lascia che sia il
          // salvataggio più recente a marcare "saved" (e a ripulire la bozza).
          if (answersRef.current === payload) {
            setSaveState("saved");
            writeDraft(payload, false);
          }
        } else {
          setSaveState("error");
        }
      } catch {
        if (mountedRef.current) setSaveState("error");
      }
    },
    [clientId, quoteId, isReadOnly, writeDraft]
  );

  /* Ripristino bozza locale + retry di sincronizzazione all'avvio */
  useEffect(() => {
    mountedRef.current = true;
    if (isReadOnly || typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const draft = JSON.parse(raw);
        const baseTs = Date.parse(initialData?.updated_at || "") || 0;
        const draftTs = Date.parse(draft?.updated_at || "") || 0;
        if (draft?.answers && (draft.pending || draftTs > baseTs)) {
          const merged = { ...normalizeAnswers(initialData), ...draft.answers };
          answersRef.current = merged;
          setAnswers(merged);
          setDraftRestored(true);
          if (draft.pending) {
            setSaveState("offline");
            void persist(merged, { silent: true });
          } else {
            setSaveState("saved");
          }
        }
      }
    } catch {
      // bozza locale illeggibile: si prosegue con i dati server
    }

    return () => {
      mountedRef.current = false;
      Object.values(textTimers.current).forEach((timer) => clearTimeout(timer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isReadOnly]);

  /* Retry automatico quando la connessione torna disponibile */
  useEffect(() => {
    if (isReadOnly || typeof window === "undefined") return;
    const handleOnline = () => {
      if (pendingRef.current && answersRef.current) {
        void persist(answersRef.current, { silent: true });
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isReadOnly, persist]);

  /* ------------------------------------------------------------------ *
   * Aggiornamento campi (autosave immediato o debounced)
   * ------------------------------------------------------------------ */
  const applyValue = useCallback(
    (field: WeddingDiaryField, value: any) => {
      if (isReadOnly) return;
      const next = { ...answersRef.current, [field.name]: value };
      answersRef.current = next;
      setAnswers(next);

      if (field.type === "text") {
        setSaveState("saving");
        writeDraft(next, true);
        const existing = textTimers.current[field.name];
        if (existing) clearTimeout(existing);
        textTimers.current[field.name] = setTimeout(() => {
          void persist(next);
        }, TEXT_DEBOUNCE_MS);
      } else {
        void persist(next);
      }
    },
    [isReadOnly, persist, writeDraft]
  );

  const toggleOption = useCallback(
    (field: WeddingDiaryField, optionValue: string) => {
      const current = Array.isArray(answersRef.current[field.name])
        ? (answersRef.current[field.name] as string[])
        : [];
      const nextValues = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      applyValue(field, nextValues);
    },
    [applyValue]
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  /* ------------------------------------------------------------------ *
   * Etichette bilingue
   * ------------------------------------------------------------------ */
  const t = {
    eyebrow: isReadOnly
      ? isEng
        ? "MEMORY CAPSULE"
        : "CAPSULA DEL TEMPO"
      : isEng
      ? "YOUR WEDDING DIARY"
      : "IL VOSTRO WEDDING DIARY",
    title: isReadOnly
      ? isEng
        ? "The story of your choices"
        : "La storia delle vostre scelte"
      : isEng
      ? "Tell us about your dream day"
      : "Raccontateci il vostro giorno",
    intro: isReadOnly
      ? isEng
        ? "Relive the choices and details that made your special day unique at La Terra degli Aranci."
        : "Rivivi le scelte e i dettagli che hanno reso unico il vostro giorno speciale a La Terra degli Aranci."
      : isEng
      ? "Fill it in calmly, whenever you like: every choice is saved automatically. Your Wedding Planner will use this dossier to prepare the perfect direction of your wedding six months before the event."
      : "Compilatelo con calma, quando volete: ogni scelta viene salvata automaticamente. La nostra Wedding Planner userà questo fascicolo per preparare la regia perfetta del matrimonio a -6 mesi dall'evento.",
    noSubmit: isEng ? "No submit button needed — your answers save themselves." : "Nessun tasto invio: le vostre risposte si salvano da sole.",
    saving: isEng ? "Saving…" : "Salvataggio…",
    saved: isEng ? "Saved automatically" : "Salvato automaticamente",
    error: isEng ? "Saved on this device — we'll sync shortly" : "Salvato su questo dispositivo — sincronizzeremo a breve",
    offline: isEng ? "Local draft restored" : "Bozza locale ripristinata",
    idle: isEng ? "Auto-save active" : "Autosave attivo",
    progressLabel: isEng ? "Diary completion" : "Completamento del Diary",
    fieldsFilled: isEng ? "fields completed" : "campi compilati",
    readOnlyBadge: isEng ? "Archive — read only" : "Archivio — sola lettura",
    liveBadge: isEng ? "Live sync with the staff" : "Sincronizzato con lo staff",
    yourAnswer: isEng ? "Your answer" : "La vostra risposta",
    chooseOne: isEng ? "Choose one option" : "Scegliete una sola opzione",
    chooseMany: isEng ? "You can select more than one" : "Potete selezionare più opzioni",
    empty: isEng ? "Not completed yet" : "Non ancora compilato",
  };

  const saveIndicator = (() => {
    if (isReadOnly) {
      return { color: "#6a6764", bg: "#f3ede3", border: "#e2d7c7", dot: "#a39f9b", text: t.readOnlyBadge };
    }
    switch (saveState) {
      case "saving":
        return { color: "#9a5a10", bg: "#fff7ec", border: "#f5d0a6", dot: "#e58c2c", text: t.saving };
      case "saved":
        return { color: "#166534", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", text: `✓ ${t.saved}` };
      case "error":
        return { color: "#92400e", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", text: `⚠ ${t.error}` };
      case "offline":
        return { color: "#92400e", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", text: t.offline };
      default:
        return { color: "#6a6764", bg: "#f7f4ef", border: "#eae2d6", dot: "#c9c2b8", text: t.idle };
    }
  })();

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "2.25rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
        border: "1px solid #eee7de",
      }}
    >
      <style>{`
        .tda-diary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.7rem; }
        .tda-diary-pill { transition: all 0.18s ease; }
        .tda-diary-pill:hover:not(:disabled) { transform: translateY(-1px); }
        .tda-diary-input:focus { outline: none; border-color: #e58c2c !important; box-shadow: 0 0 0 3px rgba(229,140,44,0.14); }
        .tda-diary-section-head:hover { background: #fdfbf7; }
        @media (max-width: 620px) {
          .tda-diary-head { flex-direction: column; align-items: flex-start !important; }
          .tda-diary-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header + indicatore di salvataggio */}
      <div
        className="tda-diary-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}
      >
        <div>
          <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2.5px", color: "#e58c2c", fontWeight: 700 }}>
            {t.eyebrow}
          </span>
          <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", margin: "0.25rem 0 0 0", fontFamily: "serif", fontWeight: 400 }}>
            📖 {t.title}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: saveIndicator.bg,
              border: `1px solid ${saveIndicator.border}`,
              color: saveIndicator.color,
              padding: "0.42rem 0.9rem",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
            role="status"
            aria-live="polite"
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: saveIndicator.dot,
                display: "inline-block",
                animation: saveState === "saving" ? "tdaPulse 1s ease-in-out infinite" : "none",
              }}
            />
            {saveIndicator.text}
          </div>
          {lastSavedAt && saveState === "saved" && (
            <small style={{ color: "#9b958d", fontSize: "0.72rem" }}>
              {new Date(lastSavedAt).toLocaleString(isEng ? "en-GB" : "it-IT", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          )}
          <style>{`@keyframes tdaPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
        </div>
      </div>

      <p style={{ color: "#6a6764", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "1.25rem", maxWidth: "760px" }}>
        {t.intro}
      </p>

      {draftRestored && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            borderRadius: "10px",
            padding: "0.7rem 1rem",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
          }}
        >
          {isEng
            ? "We restored a draft saved on this device. It will sync automatically as soon as the connection is stable."
            : "Abbiamo ripristinato una bozza salvata su questo dispositivo. Sincronizzeremo automaticamente appena la connessione sarà stabile."}
        </div>
      )}

      {/* Barra di avanzamento */}
      <div
        style={{
          background: "#faf7f2",
          border: "1px solid #f0e8dc",
          borderRadius: "14px",
          padding: "1rem 1.15rem",
          marginBottom: "1.9rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.55rem", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.5px", color: "#514d48", textTransform: "uppercase" }}>
            {t.progressLabel}
          </span>
          <span style={{ fontSize: "0.82rem", color: "#8a837a" }}>
            {WEDDING_DIARY_FIELD_COUNT} {t.fieldsFilled}
            {!isReadOnly && <span style={{ marginLeft: "0.6rem", color: "#e58c2c", fontWeight: 700, fontSize: "0.95rem" }}>{progress}%</span>}
          </span>
        </div>
        <div style={{ height: "8px", background: "#ece4d8", borderRadius: "999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "999px",
              background: progress >= 80 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f0b46a,#e58c2c)",
              transition: "width 0.45s ease",
            }}
          />
        </div>
        {!isReadOnly && (
          <small style={{ display: "block", marginTop: "0.5rem", color: "#9b958d", fontSize: "0.76rem" }}>✨ {t.noSubmit}</small>
        )}
      </div>

      {/* Sezioni */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {WEDDING_DIARY_SECTIONS.map((section, index) => {
          const isOpen = !!openSections[section.id];
          const filled = filledBySection[section.id] || 0;
          const sectionComplete = filled === section.fields.length;

          return (
            <section
              key={section.id}
              style={{
                border: "1px solid #eee7de",
                borderRadius: "14px",
                overflow: "hidden",
                background: "#fffdfa",
              }}
            >
              <button
                type="button"
                className="tda-diary-section-head"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "1.05rem 1.25rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>{section.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontWeight: 600, color: "#1e1b18", fontSize: "1.02rem", fontFamily: "serif" }}>
                    {index + 1}. {isEng ? section.titleEn : section.titleIt}
                  </span>
                  {(section.subtitleIt || section.subtitleEn) && (
                    <span style={{ display: "block", color: "#8a837a", fontSize: "0.82rem", marginTop: "2px" }}>
                      {isEng ? section.subtitleEn : section.subtitleIt}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "999px",
                    background: sectionComplete ? "#f0fdf4" : "#f7f1e6",
                    color: sectionComplete ? "#166534" : "#9a5a10",
                    border: `1px solid ${sectionComplete ? "#bbf7d0" : "#f0dfc6"}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {filled}/{section.fields.length}
                </span>
                <span
                  style={{
                    color: "#b5aea4",
                    fontSize: "0.75rem",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "0.25rem 1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.6rem" }}>
                  {section.fields.map((field) => {
                    const value = answers[field.name];
                    const singleValue = typeof value === "string" ? value : "";
                    const multiValue = Array.isArray(value) ? (value as string[]) : [];

                    return (
                      <div key={field.name}>
                        <div style={{ marginBottom: "0.6rem" }}>
                          <label
                            style={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "#2c2a27" }}
                          >
                            {isEng ? field.labelEn : field.labelIt}
                          </label>
                          <small style={{ color: "#a39f9b", fontSize: "0.76rem" }}>
                            {field.type === "radio" ? t.chooseOne : field.type === "checkbox" ? t.chooseMany : isEng ? field.helperEn : field.helperIt}
                          </small>
                        </div>

                        {field.type === "text" && (
                          <input
                            className="tda-diary-input"
                            type="text"
                            value={singleValue}
                            disabled={isReadOnly}
                            placeholder={isEng ? field.placeholderEn : field.placeholderIt}
                            onChange={(e) => applyValue(field, e.target.value)}
                            style={{
                              width: "100%",
                              maxWidth: "620px",
                              padding: "0.75rem 1rem",
                              borderRadius: "10px",
                              border: "1px solid #ded7cd",
                              fontFamily: "inherit",
                              fontSize: "0.94rem",
                              color: "#2c2a27",
                              background: isReadOnly ? "#f9f9f9" : "#fff",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                          />
                        )}

                        {field.type === "date" && (
                          <input
                            className="tda-diary-input"
                            type="date"
                            value={singleValue}
                            disabled={isReadOnly}
                            onChange={(e) => applyValue(field, e.target.value)}
                            style={{
                              padding: "0.72rem 1rem",
                              borderRadius: "10px",
                              border: "1px solid #ded7cd",
                              fontFamily: "inherit",
                              fontSize: "0.94rem",
                              color: "#2c2a27",
                              background: isReadOnly ? "#f9f9f9" : "#fff",
                            }}
                          />
                        )}

                        {field.type === "radio" && (
                          <div className="tda-diary-grid" role="radiogroup" aria-label={isEng ? field.labelEn : field.labelIt}>
                            {(field.options || []).map((option) => {
                              const selected = singleValue === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  className="tda-diary-pill"
                                  role="radio"
                                  aria-checked={selected}
                                  disabled={isReadOnly}
                                  onClick={() => applyValue(field, option.value)}
                                  style={{
                                    padding: "0.68rem 1rem",
                                    borderRadius: "999px",
                                    border: `1px solid ${selected ? "#e58c2c" : "#e3dace"}`,
                                    background: selected ? "#e58c2c" : "#faf8f5",
                                    color: selected ? "#ffffff" : "#4a4642",
                                    fontWeight: selected ? 600 : 500,
                                    fontSize: "0.88rem",
                                    cursor: isReadOnly ? "default" : "pointer",
                                    textAlign: "left",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {isEng ? option.en || option.value : option.value}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {field.type === "checkbox" && (
                          <div className="tda-diary-grid">
                            {(field.options || []).map((option) => {
                              const checked = multiValue.includes(option.value);
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  className="tda-diary-pill"
                                  role="checkbox"
                                  aria-checked={checked}
                                  disabled={isReadOnly}
                                  onClick={() => toggleOption(field, option.value)}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.6rem",
                                    padding: "0.7rem 0.95rem",
                                    borderRadius: "12px",
                                    border: `1px solid ${checked ? "#f0b46a" : "#e3dace"}`,
                                    background: checked ? "#fff7ec" : "#faf8f5",
                                    color: "#3f3b37",
                                    fontWeight: checked ? 600 : 400,
                                    fontSize: "0.87rem",
                                    cursor: isReadOnly ? "default" : "pointer",
                                    textAlign: "left",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  <span
                                    aria-hidden="true"
                                    style={{
                                      flexShrink: 0,
                                      width: "17px",
                                      height: "17px",
                                      marginTop: "1px",
                                      borderRadius: "5px",
                                      border: `1.5px solid ${checked ? "#e58c2c" : "#ccc3b6"}`,
                                      background: checked ? "#e58c2c" : "#fff",
                                      color: "#fff",
                                      fontSize: "0.7rem",
                                      lineHeight: "14px",
                                      textAlign: "center",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {checked ? "✓" : ""}
                                  </span>
                                  <span>{isEng ? option.en || option.value : option.value}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {isReadOnly && (
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#8a837a", fontSize: "0.85rem" }}>
          <span>🕰️</span>
          <span>
            {isEng
              ? "This dossier is part of your memory archive: you can browse it, but no changes can be made."
              : "Questo fascicolo fa parte del vostro archivio dei ricordi: potete consultarlo, ma non è più modificabile."}
          </span>
        </div>
      )}
    </div>
  );
}
