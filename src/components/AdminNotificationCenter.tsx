"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminNotificationsAction,
  type AdminNotification,
} from "@/app/admin/notificationsAction";

/**
 * Centro Notifiche Direzionale.
 *
 * Campanella fluttuante in alto a destra visibile da qualsiasi pagina admin.
 * Al click apre uno slide bar laterale (drawer da destra) con tutte le azioni
 * pendenti per Roberto Sola. Effettua polling leggero ogni 30s.
 */

const STORAGE_KEY = "tda_admin_notifications_read";
const POLL_INTERVAL_MS = 30_000;

const TYPE_META: Record<AdminNotification["tipo"], { icon: string; label: string }> = {
  ticket_servizi: { icon: "🎫", label: "Ticket Servizi" },
  contratto_firmato: { icon: "✍️", label: "Contratto" },
  allegato_b: { icon: "📎", label: "Allegato B" },
  appuntamento: { icon: "📅", label: "Appuntamento" },
  diary: { icon: "💍", label: "Wedding Diary" },
};

/** Formatta una data in etichetta relativa ("5 min fa", "Oggi", ...). */
function formatRelative(iso: string): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return "";

  const now = new Date();
  const diffMs = now.getTime() - time;
  if (diffMs < 0) return "Adesso";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Adesso";
  if (minutes < 60) return `${minutes} min fa`;

  const target = new Date(time);
  const sameDay =
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate();
  if (sameDay) return "Oggi";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    target.getFullYear() === yesterday.getFullYear() &&
    target.getMonth() === yesterday.getMonth() &&
    target.getDate() === yesterday.getDate();
  if (isYesterday) return "Ieri";

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    const h = Math.max(1, hours);
    return `${h} ${h === 1 ? "ora" : "ore"} fa`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} giorni fa`;

  return target.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export default function AdminNotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);

  /* --- Persistenza stato "letto" ---------------------------------- */
  useEffect(() => {
    let cancelled = false;
    const loadReadIds = () => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed.map((id: unknown) => String(id))));
        }
      } catch {
        // localStorage non disponibile: si riparte da zero.
      }
    };
    const handle = window.setTimeout(loadReadIds, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, []);

  const persistRead = useCallback((next: Set<string>) => {
    setReadIds(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // Ignora errori di quota / privacy mode.
    }
  }, []);

  /* --- Fetch iniziale + polling ----------------------------------- */
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getAdminNotificationsAction();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // Mantiene l'ultimo elenco valido in caso di errore di rete.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Primo fetch e polling deferiti in callback, così da non aggiornare lo
    // stato in modo sincrono nel corpo dell'effect.
    const firstLoad = window.setTimeout(fetchNotifications, 0);
    const interval = window.setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const markAllRead = useCallback(() => {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    persistRead(next);
  }, [notifications, readIds, persistRead]);

  const handleNotificationClick = useCallback(
    (notification: AdminNotification) => {
      const next = new Set(readIds);
      next.add(notification.id);
      persistRead(next);
      setOpen(false);
      if (notification.link) router.push(notification.link);
    },
    [readIds, persistRead, router]
  );

  /* --- Chiusura con tasto Escape ---------------------------------- */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <style>{`
        @keyframes tdaNotifyPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.65); }
          70% { transform: scale(1.12); box-shadow: 0 0 0 9px rgba(239,68,68,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes tdaOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tdaDrawerSlide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .tda-notify-card:hover { background: #faf7f2 !important; transform: translateX(-2px); }
      `}</style>

      {/* Campanella fluttuante */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Apri Centro Notifiche Direzione"
        title="Centro Notifiche Direzione"
        style={{
          position: "fixed",
          top: "1.1rem",
          right: "1.4rem",
          zIndex: 500,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          border: "1px solid #e6e0d8",
          background: "#ffffff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          boxShadow: "0 8px 22px rgba(30,27,24,0.18)",
        }}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              minWidth: "22px",
              height: "22px",
              padding: "0 5px",
              borderRadius: "11px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ffffff",
              animation: "tdaNotifyPulse 2s infinite",
            }}
          >
            {unreadCount > 99 ? "99+" : `+${unreadCount}`}
          </span>
        )}
      </button>

      {/* Overlay + Drawer laterale */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(20,17,14,0.5)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            display: "flex",
            justifyContent: "flex-end",
            animation: "tdaOverlayFade 0.22s ease-out",
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Notifiche Direzione"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "420px",
              maxWidth: "95vw",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-12px 0 40px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              animation: "tdaDrawerSlide 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Header */}
            <header style={{ background: "#1e1b18", color: "#fcfbfa", padding: "1.4rem 1.4rem 1.2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.8rem" }}>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "serif",
                      fontSize: "1.25rem",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span aria-hidden="true">🔔</span> Notifiche Direzione
                  </h2>
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#b0aba5", lineHeight: 1.4 }}>
                    {"Tutte le azioni che richiedono l'attenzione di Roberto Sola"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi notifiche"
                  style={{
                    background: "transparent",
                    border: "1px solid #44403c",
                    color: "#d6d1cb",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: unreadCount > 0 ? "#ef4444" : "#332f2b",
                    color: "#ffffff",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                  }}
                >
                  {unreadCount} {unreadCount === 1 ? "non letta" : "non lette"}
                </span>

                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: unreadCount === 0 ? "#6f6a64" : "#e58c2c",
                    cursor: unreadCount === 0 ? "default" : "pointer",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textDecoration: "underline",
                    padding: "0.2rem",
                  }}
                >
                  Segna tutte come lette
                </button>
              </div>
            </header>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {loading && notifications.length === 0 ? (
                <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#8a847d", fontSize: "0.9rem" }}>
                  Caricamento notifiche…
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "3.5rem 1.5rem",
                    color: "#6f6a64",
                  }}
                >
                  <span style={{ fontSize: "3rem", marginBottom: "0.8rem" }} aria-hidden="true">
                    🌿
                  </span>
                  <strong style={{ fontSize: "1.05rem", color: "#3f3a34" }}>
                    {"Nessuna notifica pendente. Tutto sotto controllo!"}
                  </strong>
                  <span style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#8a847d" }}>
                    Le nuove richieste servizi, firme e appuntamenti compariranno qui.
                  </span>
                </div>
              ) : (
                notifications.map((notification) => {
                  const meta = TYPE_META[notification.tipo] || { icon: "🔔", label: "Notifica" };
                  const isRead = readIds.has(notification.id);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className="tda-notify-card"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        textAlign: "left",
                        width: "100%",
                        cursor: "pointer",
                        background: isRead ? "#fbfaf9" : "#ffffff",
                        border: "1px solid #ece7e0",
                        borderLeft: `4px solid ${isRead ? "#d8d3cd" : notification.badgeColor}`,
                        borderRadius: "12px",
                        padding: "0.9rem 0.95rem",
                        display: "flex",
                        gap: "0.8rem",
                        opacity: isRead ? 0.72 : 1,
                        transition: "background 0.15s ease, transform 0.15s ease",
                        boxShadow: isRead ? "none" : "0 3px 10px rgba(30,27,24,0.05)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: notification.badgeBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem",
                          flexShrink: 0,
                        }}
                      >
                        {meta.icon}
                      </span>

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              background: notification.badgeBg,
                              color: notification.badgeColor,
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                            }}
                          >
                            {notification.badgeLabel}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "#9a948d", flexShrink: 0 }}>
                            {formatRelative(notification.data)}
                          </span>
                        </span>

                        <span
                          style={{
                            display: "block",
                            marginTop: "0.45rem",
                            fontWeight: 700,
                            fontSize: "0.92rem",
                            color: "#2c2823",
                          }}
                        >
                          {notification.titolo}
                        </span>
                        <span
                          style={{
                            display: "block",
                            marginTop: "0.15rem",
                            fontSize: "0.84rem",
                            color: "#5c5650",
                            lineHeight: 1.4,
                          }}
                        >
                          {notification.messaggio}
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "0.5rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#e58c2c",
                          }}
                        >
                          {meta.label} → Apri
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <footer
              style={{
                borderTop: "1px solid #ece7e0",
                padding: "0.8rem 1.2rem",
                fontSize: "0.72rem",
                color: "#9a948d",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              <span>Aggiornamento automatico ogni 30s</span>
              <span>Direzione Roberto Sola</span>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
