"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SERVICES_CATALOG, type ServiceCatalogItem } from "@/lib/servicesCatalog";
import {
  submitServiceTicketAction,
  getServiceTicketsForQuoteAction,
} from "@/app/cliente/actions";
import type { ServiceTicket, ServiceTicketItem } from "@/lib/localDb";

interface ClientServiceWishlistProps {
  quoteId: string;
  quoteItems?: any[];
  lang?: "it" | "en";
  isPastEvent?: boolean;
}

type CategoryFilter =
  | "tutti"
  | "mixology"
  | "gourmet"
  | "luci"
  | "musica"
  | "dolci"
  | "allestimenti";

type BucketKey = Exclude<CategoryFilter, "tutti">;

/**
 * Classifica un servizio del catalogo in una delle "vetrine" tematiche
 * mostrate agli sposi. I controlli più specifici (luci, musica, dolci,
 * mixology, allestimenti) precedono il fallback gourmet.
 */
function getServiceBucket(item: ServiceCatalogItem): BucketKey {
  const name = `${item.nome || ""} ${item.titoloBase || ""} ${item.variante || ""}`.toLowerCase();
  const categoria = (item.categoria || "").toLowerCase();

  if (
    categoria.includes("luci") ||
    categoria.includes("palco") ||
    /illuminazione|spot\s|sfera|fuochi freddi|palco/.test(name)
  ) {
    return "luci";
  }

  if (/musica|service audio|fonico|\bdj\b|\bband\b/.test(name)) {
    return "musica";
  }

  if (/dolc|torta|cake|confettata|gelat|cioccolat|dessert|mignon/.test(name)) {
    return "dolci";
  }

  if (/spritz|champagneria|cocktail|liquor|birra artigianale/.test(name)) {
    return "mixology";
  }

  if (
    categoria.includes("allestim") ||
    categoria.includes("struttur") ||
    /allestim|tensostruttura|tavolo imperiale|runner|mise en place|percorso|cordolo|segnaposto|partecipazioni|bomboniere/.test(
      name
    )
  ) {
    return "allestimenti";
  }

  return "gourmet";
}

const CATEGORY_OPTIONS: { key: CategoryFilter; it: string; en: string }[] = [
  { key: "tutti", it: "Tutte", en: "All" },
  { key: "mixology", it: "🍸 Mixology", en: "🍸 Mixology" },
  { key: "gourmet", it: "🍽️ Gourmet & Angoli", en: "🍽️ Gourmet & Corners" },
  { key: "luci", it: "✨ Luci & Atmosfere", en: "✨ Lights & Atmosphere" },
  { key: "musica", it: "🎵 Musica", en: "🎵 Music" },
  { key: "dolci", it: "🍰 Dolci & Cake", en: "🍰 Desserts & Cake" },
  { key: "allestimenti", it: "🏛️ Allestimenti", en: "🏛️ Set-ups" },
];

export default function ClientServiceWishlist({
  quoteId,
  quoteItems = [],
  lang = "it",
  isPastEvent = false,
}: ClientServiceWishlistProps) {
  const isEng = lang === "en";

  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceTicketItem[]>([]);
  const [noteSposi, setNoteSposi] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("tutti");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  // Carica lo storico dei ticket inviati per questo preventivo.
  useEffect(() => {
    let active = true;
    if (!quoteId) {
      setTickets([]);
      return;
    }
    getServiceTicketsForQuoteAction(quoteId)
      .then((res) => {
        if (!active) return;
        setTickets(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (active) setTickets([]);
      });
    return () => {
      active = false;
    };
  }, [quoteId]);

  const contractItems: any[] = Array.isArray(quoteItems) ? quoteItems : [];

  const formatPrice = (item: ServiceCatalogItem): string => {
    const price = Number(item.prezzo_unitario) || 0;
    if (price <= 0) {
      return isEng ? "To be quoted" : "Da quotare";
    }
    const amount = price.toLocaleString("it-IT");
    if (item.unita_misura === "pax" || item.unita_misura === "child") {
      return isEng ? `from € ${amount}` : `a partire da € ${amount}`;
    }
    return `€ ${amount}`;
  };

  const formatDate = (iso?: string): string => {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString(isEng ? "en-GB" : "it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusMeta = (status: ServiceTicket["status"]) => {
    switch (status) {
      case "approvato":
        return {
          emoji: "✅",
          label: isEng ? "Approved by Management" : "Approvato dalla Direzione",
          bg: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
        };
      case "rifiutato":
        return {
          emoji: "ℹ️",
          label: isEng ? "Not available" : "Non accoglibile",
          bg: "#f1f5f9",
          color: "#475569",
          border: "#e2e8f0",
        };
      default:
        return {
          emoji: "🟡",
          label: isEng
            ? "Under Review by Management"
            : "In Valutazione presso la Direzione",
          bg: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
        };
    }
  };

  const isSelected = (id: string) => selectedServices.some((s) => s.id === id);

  const addService = (item: ServiceCatalogItem) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedServices((prev) => {
      if (prev.some((s) => s.id === item.id)) return prev;
      const entry: ServiceTicketItem = {
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        prezzo_unitario: item.prezzo_unitario,
        quantita: 1,
        immagine: item.immagine,
        azione: "aggiunta",
      };
      return [...prev, entry];
    });
  };

  const removeService = (id: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
  };

  const changeQuantity = (id: string, delta: number) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, quantita: Math.max(1, (Number(s.quantita) || 1) + delta) }
          : s
      )
    );
  };

  const selectedCount = selectedServices.length;

  const indicativeTotal = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (Number(s.prezzo_unitario) || 0) * (Number(s.quantita) || 1),
        0
      ),
    [selectedServices]
  );

  const filteredCatalog = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return SERVICES_CATALOG.filter((item) => {
      if (selectedCategory !== "tutti" && getServiceBucket(item) !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const haystack = `${item.nome || ""} ${item.titoloBase || ""} ${
        item.variante || ""
      } ${item.categoria || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [selectedCategory, searchTerm]);

  const handleSubmit = async () => {
    if (submitting || isPastEvent) return;

    if (selectedServices.length === 0 && !noteSposi.trim()) {
      setErrorMessage(
        isEng
          ? "Select at least one service or write a note for Management."
          : "Selezionate almeno un servizio oppure scrivete una nota per la Direzione."
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await submitServiceTicketAction({
        quoteId,
        servizi: selectedServices,
        noteSposi: noteSposi.trim() || undefined,
      });

      if (result.success) {
        setTickets((prev) => [result.ticket, ...prev]);
        setSelectedServices([]);
        setNoteSposi("");
        setNotesOpen(false);
        setSuccessMessage(
          isEng
            ? "Your request has been sent to Roberto and Management! You will hear back shortly."
            : "La vostra richiesta è stata inviata a Roberto e alla Direzione! Riceverete riscontro a breve."
        );
      } else {
        setErrorMessage(
          result.error ||
            (isEng ? "Error while sending the request." : "Errore durante l'invio della richiesta.")
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isEng ? "Error while sending the request." : "Errore durante l'invio della richiesta.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "2rem 2.25rem",
    border: "1px solid #eee7de",
    boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.55rem 1.1rem",
    borderRadius: "999px",
    border: active ? "1px solid #e58c2c" : "1px solid #e2d7c7",
    background: active ? "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)" : "#fdfbf7",
    color: active ? "#ffffff" : "#6a6764",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
    fontFamily: "inherit",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* INTRO & REGOLE */}
      <div
        style={{
          ...cardStyle,
          background: "linear-gradient(135deg, #fff8ee 0%, #fdf1e0 100%)",
          border: "1px solid #f3d9b4",
          borderLeft: "4px solid #e58c2c",
        }}
      >
        <span
          style={{
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "#b8761f",
            fontWeight: 700,
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          {isEng ? "EXPERIENCE SHOWCASE" : "VETRINA ESPERIENZE"}
        </span>
        <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", margin: "0 0 0.6rem 0", fontWeight: 600 }}>
          🍊 {isEng ? "Build your ideal event" : "Componete il vostro evento ideale"}
        </h2>
        <p style={{ margin: 0, color: "#5a4a35", fontSize: "1rem", lineHeight: 1.65, maxWidth: "860px" }}>
          {isEng
            ? "In this section you can request the addition or removal of a service. The earlier you let us know, the better: our Management will verify the technical feasibility with the kitchen and suppliers before the definitive closing 10 days before the event."
            : "In questa sezione potete richiedere l'aggiunta o l'eliminazione di un servizio. Prima lo comunicate, meglio è: la nostra Direzione verificherà la fattibilità tecnica con cucina e fornitori prima della chiusura definitiva a 10 giorni dall'evento."}
        </p>

        {contractItems.length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px dashed #e6cfa8",
              fontSize: "0.88rem",
              color: "#7a5a2e",
            }}
          >
            <strong style={{ color: "#9a5a10" }}>
              {isEng ? "Services currently under contract: " : "Voci attualmente a contratto: "}
            </strong>
            {contractItems
              .slice(0, 6)
              .map((it) => it?.descrizione || it?.nome || it?.titolo)
              .filter(Boolean)
              .join(" · ")}
            {contractItems.length > 6
              ? ` ${isEng ? `+${contractItems.length - 6} more` : `+${contractItems.length - 6} altre`}`
              : ""}
            <div style={{ marginTop: "0.35rem", color: "#8a6a3c" }}>
              {isEng
                ? "For variations to these items, write a note in the request cart."
                : "Per variazioni a queste voci, scrivete una nota nel carrello della richiesta."}
            </div>
          </div>
        )}

        {isPastEvent && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.85rem 1.1rem",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#475569",
              fontSize: "0.92rem",
            }}
          >
            ℹ️{" "}
            {isEng
              ? "This event has already taken place: requests are closed. Contact us for your next celebration."
              : "Questo evento si è già svolto: le richieste sono chiuse. Contattateci per il prossimo evento."}
          </div>
        )}
      </div>

      {/* STORICO TICKET INVIATI */}
      {tickets.length > 0 && (
        <div style={cardStyle}>
          <span
            style={{
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#e58c2c",
              fontWeight: 700,
              display: "block",
              marginBottom: "0.35rem",
            }}
          >
            {isEng ? "SENT REQUESTS" : "RICHIESTE INVIATE"}
          </span>
          <h2 style={{ fontSize: "1.45rem", color: "#1e1b18", margin: "0 0 1.5rem 0", fontWeight: 600 }}>
            📨 {isEng ? "Your Service Requests" : "Le Vostre Richieste di Servizi"}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {tickets.map((ticket) => {
              const meta = statusMeta(ticket.status);
              const servizi = Array.isArray(ticket.servizi) ? ticket.servizi : [];
              return (
                <div
                  key={ticket.id}
                  style={{
                    padding: "1.4rem 1.6rem",
                    borderRadius: "14px",
                    background: "#faf8f5",
                    border: "1px solid #eee8df",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.9rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.8rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        padding: "0.35rem 0.85rem",
                        borderRadius: "999px",
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      <span aria-hidden="true">{meta.emoji}</span>
                      {meta.label}
                    </span>
                    <small style={{ color: "#888" }}>
                      📅 {formatDate(ticket.created_at)}
                    </small>
                  </div>

                  {servizi.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {servizi.map((s, idx) => (
                        <div
                          key={`${ticket.id}-${s.id || idx}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1rem",
                            fontSize: "0.92rem",
                            color: "#2c2a27",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>
                            {s.azione === "rimozione" ? "− " : "+ "}
                            {s.nome}
                            {s.quantita && Number(s.quantita) > 1 ? ` × ${s.quantita}` : ""}
                          </span>
                          <span style={{ color: "#6a6764", whiteSpace: "nowrap" }}>
                            {Number(s.prezzo_unitario) > 0
                              ? `€ ${(Number(s.prezzo_unitario) * (Number(s.quantita) || 1)).toLocaleString(
                                  "it-IT"
                                )}`
                              : isEng
                              ? "To be quoted"
                              : "Da quotare"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {ticket.note_sposi && (
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#5a4a35",
                        background: "#ffffff",
                        border: "1px solid #eee8df",
                        borderRadius: "10px",
                        padding: "0.7rem 0.9rem",
                        lineHeight: 1.55,
                      }}
                    >
                      <strong>{isEng ? "Your note: " : "Nota degli sposi: "}</strong>
                      {ticket.note_sposi}
                    </div>
                  )}

                  {ticket.note_direzione && (
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#166534",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                        padding: "0.7rem 0.9rem",
                        lineHeight: 1.55,
                      }}
                    >
                      <strong>{isEng ? "Management reply: " : "Risposta della Direzione: "}</strong>
                      {ticket.note_direzione}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARRELLO DELLA RICHIESTA IN CORSO */}
      {(selectedServices.length > 0 || notesOpen) && (
        <div
          style={{
            ...cardStyle,
            border: selectedServices.length > 0 ? "1px solid #f3d9b4" : "1px solid #eee7de",
            boxShadow: "0 12px 30px rgba(229,140,44,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1.2rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "#e58c2c",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.3rem",
                }}
              >
                {isEng ? "CURRENT REQUEST" : "RICHIESTA IN CORSO"}
              </span>
              <h2 style={{ fontSize: "1.45rem", color: "#1e1b18", margin: 0, fontWeight: 600 }}>
                🛒 {isEng ? "Request Cart" : "Carrello della Richiesta"}
              </h2>
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#ffffff",
                background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                borderRadius: "999px",
                padding: "0.4rem 1rem",
                whiteSpace: "nowrap",
              }}
            >
              {selectedCount} {isEng ? (selectedCount === 1 ? "service" : "services") : "servizi"}
            </span>
          </div>

          {selectedServices.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {selectedServices.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                    padding: "0.8rem 1rem",
                    borderRadius: "12px",
                    background: "#faf8f5",
                    border: "1px solid #eee8df",
                  }}
                >
                  <div style={{ flex: "1 1 240px", minWidth: "180px" }}>
                    <div style={{ fontWeight: 600, color: "#1e1b18", fontSize: "0.95rem" }}>
                      {s.nome}
                    </div>
                    <small style={{ color: "#8a857e" }}>
                      {Number(s.prezzo_unitario) > 0
                        ? `€ ${Number(s.prezzo_unitario).toLocaleString("it-IT")} ${
                            isEng ? "each" : "cad."
                          }`
                        : isEng
                        ? "To be quoted"
                        : "Da quotare"}
                    </small>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #e2d7c7",
                        borderRadius: "10px",
                        overflow: "hidden",
                        background: "#ffffff",
                      }}
                    >
                      <button
                        type="button"
                        aria-label={isEng ? "Decrease quantity" : "Riduci quantità"}
                        onClick={() => changeQuantity(s.id, -1)}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: "0.35rem 0.7rem",
                          cursor: "pointer",
                          fontSize: "1rem",
                          color: "#e58c2c",
                          fontFamily: "inherit",
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          minWidth: "2rem",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#1e1b18",
                          fontSize: "0.92rem",
                        }}
                      >
                        {Number(s.quantita) || 1}
                      </span>
                      <button
                        type="button"
                        aria-label={isEng ? "Increase quantity" : "Aumenta quantità"}
                        onClick={() => changeQuantity(s.id, 1)}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: "0.35rem 0.7rem",
                          cursor: "pointer",
                          fontSize: "1rem",
                          color: "#e58c2c",
                          fontFamily: "inherit",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeService(s.id)}
                      style={{
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: "10px",
                        padding: "0.45rem 0.8rem",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      🗑️ {isEng ? "Remove" : "Rimuovi"}
                    </button>
                  </div>
                </div>
              ))}

              {indicativeTotal > 0 && (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "0.9rem",
                    color: "#6a6764",
                    paddingTop: "0.3rem",
                  }}
                >
                  {isEng ? "Indicative total: " : "Totale indicativo: "}
                  <strong style={{ color: "#e58c2c" }}>
                    € {indicativeTotal.toLocaleString("it-IT")}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: "0 0 0.8rem 0", color: "#8a857e", fontSize: "0.92rem" }}>
              {isEng
                ? "No services selected yet. Write your note below or add services from the showcase."
                : "Nessun servizio selezionato. Scrivete la vostra nota qui sotto oppure aggiungete servizi dalla vetrina."}
            </p>
          )}

          <div style={{ marginTop: "1.3rem" }}>
            <label
              htmlFor="service-wishlist-notes"
              style={{
                display: "block",
                fontWeight: 600,
                color: "#1e1b18",
                fontSize: "0.92rem",
                marginBottom: "0.4rem",
              }}
            >
              📝{" "}
              {isEng
                ? "Custom requests or variations to contracted items"
                : "Richieste particolari o variazioni di voci già a contratto"}
            </label>
            <textarea
              id="service-wishlist-notes"
              value={noteSposi}
              onChange={(e) => setNoteSposi(e.target.value)}
              rows={3}
              placeholder={
                isEng
                  ? "E.g. replace the fish second course, add a vintage car corner, remove the chocolate fountain..."
                  : "Es. sostituire il secondo di pesce, aggiungere un angolo auto d'epoca, eliminare la fontana di cioccolato..."
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                border: "1px solid #e2d7c7",
                background: "#ffffff",
                fontSize: "0.92rem",
                color: "#2c2a27",
                fontFamily: "inherit",
                resize: "vertical",
                lineHeight: 1.55,
              }}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                marginTop: "0.9rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "0.9rem",
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginTop: "0.9rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "0.92rem",
                fontWeight: 600,
              }}
            >
              ✅ {successMessage}
            </div>
          )}

          <div
            style={{
              marginTop: "1.2rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.8rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedServices([]);
                setNoteSposi("");
                setNotesOpen(false);
                setErrorMessage(null);
              }}
              style={{
                padding: "0.9rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid #e2d7c7",
                background: "#ffffff",
                color: "#6a6764",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {isEng ? "Clear" : "Annulla"}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || isPastEvent}
              style={{
                padding: "0.95rem 1.9rem",
                borderRadius: "12px",
                border: "none",
                background:
                  submitting || isPastEvent
                    ? "#e6d9c8"
                    : "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                color: submitting || isPastEvent ? "#9a8a74" : "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: submitting || isPastEvent ? "not-allowed" : "pointer",
                boxShadow:
                  submitting || isPastEvent ? "none" : "0 8px 20px rgba(229,140,44,0.35)",
                fontFamily: "inherit",
              }}
            >
              {submitting
                ? isEng
                  ? "⏳ Sending..."
                  : "⏳ Invio in corso..."
                : isEng
                ? "📨 Send Request to Management"
                : "📨 Invia Richiesta alla Direzione"}
            </button>
          </div>
        </div>
      )}

      {/* VETRINA CATALOGO */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.2rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#e58c2c",
                fontWeight: 700,
                display: "block",
                marginBottom: "0.3rem",
              }}
            >
              {isEng ? "SERVICE SHOWCASE" : "VETRINA SERVIZI"}
            </span>
            <h2 style={{ fontSize: "1.45rem", color: "#1e1b18", margin: 0, fontWeight: 600 }}>
              ✨ {isEng ? "Explore Experiences" : "Esplorate le Esperienze"}
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isEng ? "Search a service..." : "Cerca un servizio..."}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: "999px",
                border: "1px solid #e2d7c7",
                background: "#fdfbf7",
                fontSize: "0.88rem",
                color: "#2c2a27",
                fontFamily: "inherit",
                minWidth: "200px",
              }}
            />
            {!notesOpen && (
              <button
                type="button"
                onClick={() => setNotesOpen(true)}
                style={pillStyle(false)}
              >
                📝 {isEng ? "Note only" : "Solo nota"}
              </button>
            )}
          </div>
        </div>

        {/* Filtri categoria */}
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
            marginBottom: "1.6rem",
          }}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedCategory(option.key)}
              style={pillStyle(selectedCategory === option.key)}
            >
              {isEng ? option.en : option.it}
            </button>
          ))}
        </div>

        {filteredCatalog.length === 0 ? (
          <p style={{ color: "#8a857e", fontSize: "0.95rem" }}>
            {isEng
              ? "No services match your search."
              : "Nessun servizio corrisponde alla ricerca."}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1.3rem",
            }}
          >
            {filteredCatalog.map((item) => {
              const selected = isSelected(item.id);
              const bucket = getServiceBucket(item);
              const bucketLabel = isEng
                ? CATEGORY_OPTIONS.find((c) => c.key === bucket)?.en
                : CATEGORY_OPTIONS.find((c) => c.key === bucket)?.it;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    overflow: "hidden",
                    background: "#ffffff",
                    border: selected ? "2px solid #e58c2c" : "1px solid #eee5d8",
                    boxShadow: selected
                      ? "0 12px 28px rgba(229,140,44,0.18)"
                      : "0 6px 18px rgba(0,0,0,0.03)",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      height: "140px",
                      background: "#f3ede3",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={item.immagine}
                      alt={item.nome}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "0.6rem",
                        left: "0.6rem",
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontWeight: 700,
                        padding: "0.25rem 0.6rem",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.92)",
                        color: "#b8761f",
                      }}
                    >
                      {bucketLabel}
                    </span>
                    {selected && (
                      <span
                        style={{
                          position: "absolute",
                          top: "0.6rem",
                          right: "0.6rem",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          background: "#e58c2c",
                          color: "#ffffff",
                        }}
                      >
                        ✓ {isEng ? "Added" : "Aggiunto"}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "1rem 1.1rem 1.2rem 1.1rem",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      gap: "0.6rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        color: "#1e1b18",
                        fontWeight: 600,
                        margin: 0,
                        lineHeight: 1.35,
                        flex: 1,
                      }}
                    >
                      {item.nome}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.6rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "#e58c2c",
                        }}
                      >
                        {formatPrice(item)}
                      </span>
                      <small style={{ color: "#9a948c", fontSize: "0.75rem" }}>
                        {item.unitaLabel}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() => (selected ? removeService(item.id) : addService(item))}
                      disabled={isPastEvent}
                      style={{
                        marginTop: "0.2rem",
                        padding: "0.65rem 1rem",
                        borderRadius: "10px",
                        border: selected ? "1px solid #e58c2c" : "none",
                        background: selected
                          ? "#fff8ee"
                          : isPastEvent
                          ? "#f1ede6"
                          : "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                        color: selected ? "#b8761f" : isPastEvent ? "#9a8a74" : "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        cursor: isPastEvent ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {selected
                        ? isEng
                          ? "✓ Added — Remove"
                          : "✓ Aggiunto — Rimuovi"
                        : isEng
                        ? "+ Request"
                        : "+ Richiedi"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
