import React, { useState, useEffect } from 'react';
import {
  Users,
  Music,
  Download,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Trash2,
  Lock,
  RefreshCw,
  Volume2,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { invitiApi, CrmGuestRecord, CrmKpiSummary } from '../../services/invitiApi';

interface SposiCRMProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (text: string) => void;
  onSongChange?: (newSongUrl: string) => void;
}

const PRESET_SONGS = [
  { label: 'Kris Bowers — Bridgerton Theme (Ufficiale)', url: '/invito/audio/musica_sposi.mp3' },
  { label: 'Christina Perri — A Thousand Years', url: 'https://cdn.pixabay.com/download/audio/2022-05-27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3' },
  { label: 'Romantic Wedding Acoustic — Soft Strings', url: 'https://cdn.pixabay.com/download/audio/2022-01-18/audio_d0a13f69d2.mp3?filename=wedding-10118.mp3' },
];

type FilterType = 'all' | 'confermati' | 'declinati' | 'messaggi' | 'esigenze';

const FILTERS: Array<{ id: FilterType; label: string }> = [
  { id: 'all', label: 'Tutti' },
  { id: 'confermati', label: 'Confermati' },
  { id: 'declinati', label: 'Declinati' },
  { id: 'messaggi', label: 'Messaggi & Bonifici' },
  { id: 'esigenze', label: 'Note Cucina / Celiaci' },
];

/** Escape HTML per il documento di stampa PDF (nessuna iniezione dai campi ospiti). */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toInt(value: string | undefined | null): number {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Separa l'elenco accompagnatori (stringa CSV, JSON array o righe multiple). */
function splitCompanionList(raw: string | undefined | null): string[] {
  const value = String(raw ?? '').trim();
  if (!value) return [];
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item ?? '').trim()).filter(Boolean);
      }
    } catch {
      // JSON non valido: si procede con lo split testuale
    }
  }
  return value
    .split(/,|;|\n/)
    .map(part => part.trim())
    .filter(Boolean);
}

/** Estrae nome ed età dei bambini dal campo eta_bambini (es. "Leo (6 anni), Sofia (3a)"). */
function parseChildrenAges(raw: string | undefined | null): Array<{ name: string; age: string }> {
  return String(raw ?? '')
    .split(/,|;|\n/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^(.*?)\s*\((\d+)\s*a?(?:nni)?\)?\.?$/i);
      if (match) return { name: match[1].trim(), age: match[2] };
      return { name: part, age: '' };
    });
}

/** Ricostruisce tipologia ed elenco componenti del nucleo di un ospite confermato. */
function getNucleoInfo(g: CrmGuestRecord): {
  emoji: string;
  label: string;
  total: number;
  adults: number;
  children: number;
  companions: string[];
  childrenList: Array<{ name: string; age: string }>;
} | null {
  if (g.presenza !== 'confermato') return null;
  const adults = toInt(g.num_adulti) || 1;
  const children = toInt(g.num_bambini);
  const total = adults + children;
  const tipo = String(g.tipologia_nucleo ?? '').trim().toLowerCase();
  let label: string;
  let emoji: string;
  if (tipo.includes('coppia')) {
    label = 'Coppia';
    emoji = '👥';
  } else if (tipo.includes('famiglia') || tipo.includes('gruppo')) {
    label = 'Famiglia / Gruppo';
    emoji = '👨‍👩‍👧‍👦';
  } else if (tipo.includes('singol')) {
    label = 'Singolo';
    emoji = '👤';
  } else if (children > 0 || adults > 2) {
    label = 'Famiglia / Gruppo';
    emoji = '👨‍👩‍👧‍👦';
  } else if (adults === 2) {
    label = 'Coppia';
    emoji = '👥';
  } else {
    label = 'Singolo';
    emoji = '👤';
  }
  return {
    emoji,
    label,
    total,
    adults,
    children,
    companions: splitCompanionList(g.accompagnatori),
    childrenList: children > 0 ? parseChildrenAges(g.eta_bambini) : [],
  };
}

export const SposiCRM: React.FC<SposiCRMProps> = ({
  isOpen,
  onClose,
  onNotify,
  onSongChange,
}) => {
  const slug = invitiApi.getCurrentSlug();
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ospiti' | 'jukebox' | 'canzone'>('ospiti');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // CRM Data
  const [kpi, setKpi] = useState<CrmKpiSummary | null>(null);
  const [guests, setGuests] = useState<CrmGuestRecord[]>([]);
  const [playlist, setPlaylist] = useState<Array<{ canzone: string; richiesta_da: string }>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Song management
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>('/invito/audio/musica_sposi.mp3');
  const [customSongUrl, setCustomSongUrl] = useState<string>('');

  // Check saved session PIN
  useEffect(() => {
    const savedPin = sessionStorage.getItem(`crm_pin_${slug}`);
    if (savedPin) {
      setPin(savedPin);
      loadCrmData(savedPin);
    }
  }, [slug]);

  if (!isOpen) return null;

  const loadCrmData = async (activePin: string) => {
    setIsLoading(true);
    setErrorMsg('');
    const res = await invitiApi.getCrmGuests(slug, activePin);
    setIsLoading(false);

    if (res && res.success) {
      setIsAuthenticated(true);
      setKpi(res.kpi);
      setGuests(res.guests);
      setPlaylist(res.playlist);
      sessionStorage.setItem(`crm_pin_${slug}`, activePin);
    } else {
      setIsAuthenticated(false);
      setErrorMsg('PIN non valido. Riprova con il codice a 4 cifre.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    await loadCrmData(pin.trim());
  };

  const handleRefresh = async () => {
    if (!pin) return;
    await loadCrmData(pin);
    onNotify?.('Dati CRM aggiornati in tempo reale!');
  };

  const handleTogglePresence = async (guest: CrmGuestRecord) => {
    const newPresence = guest.presenza === 'confermato' ? 'declinato' : 'confermato';
    const ok = await invitiApi.updateGuest(slug, pin, parseInt(guest.id), 'update', {
      presenza: newPresence,
    });
    if (ok) {
      await loadCrmData(pin);
      onNotify?.(`Stato aggiornato per ${guest.nome}: ${newPresence.toUpperCase()}`);
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler rimuovere ${name} dall'elenco?`)) return;
    const ok = await invitiApi.updateGuest(slug, pin, parseInt(id), 'delete');
    if (ok) {
      await loadCrmData(pin);
      onNotify?.(`${name} rimosso con successo.`);
    }
  };

  const handleSaveSong = async () => {
    const targetUrl = customSongUrl.trim() || selectedSongUrl;
    if (!targetUrl) return;
    setIsLoading(true);
    const ok = await invitiApi.updateSong(slug, pin, targetUrl);
    setIsLoading(false);
    if (ok) {
      onSongChange?.(targetUrl);
      onNotify?.('Canzone di sottofondo aggiornata con successo! 🎵');
    } else {
      alert('Errore durante il salvataggio della canzone.');
    }
  };

  const handleCopyPlaylist = () => {
    const text = playlist.map((p, idx) => `${idx + 1}. ${p.canzone} (richiesta da: ${p.richiesta_da})`).join('\n');
    navigator.clipboard.writeText(text);
    onNotify?.('Scaletta brani per il DJ copiata negli appunti! 📋');
  };

  /**
   * Esportazione PDF ad alta definizione del Registro Ufficiale Invitati.
   * Genera una finestra di stampa pulita (HTML/CSS @media print, A4 landscape)
   * e apre la dialog nativa del browser: da smartphone iOS/Android basta
   * "Salva come PDF / Salva su File", da desktop "Salva come PDF".
   * Nessuna dipendenza esterna: funziona ovunque, anche offline.
   */
  const handleExportPdf = () => {
    if (guests.length === 0) {
      onNotify?.('Nessun invitato da esportare: il registro è ancora vuoto.');
      return;
    }

    const confermatiList = guests.filter(g => g.presenza === 'confermato');
    const totaleAdulti = confermatiList.reduce((sum, g) => sum + toInt(g.num_adulti), 0);
    const totaleBambini = confermatiList.reduce((sum, g) => sum + toInt(g.num_bambini), 0);
    const totaleEsigenze = guests.filter(g => Boolean(g.intolleranze || g.note_chef)).length;
    const totaleBonifici = guests.filter(g => g.bonifico_notificato === '1').length;
    const generatoIl = new Date().toLocaleString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const kpiItems: Array<{ value: number; label: string }> = [
      { value: kpi?.totale_ospiti ?? guests.length, label: 'Totale invitati' },
      { value: kpi?.confermati ?? confermatiList.length, label: 'Confermati' },
      { value: (kpi?.adulti ?? totaleAdulti) + (kpi?.bambini ?? totaleBambini), label: 'Coperti totali' },
      { value: kpi?.adulti ?? totaleAdulti, label: 'Adulti' },
      { value: kpi?.bambini ?? totaleBambini, label: 'Bambini' },
      { value: kpi?.con_esigenze ?? totaleEsigenze, label: 'Esigenze alimentari' },
      { value: kpi?.bonifici_notificati ?? totaleBonifici, label: 'Bonifici segnalati' },
    ];
    const kpiHtml = kpiItems
      .map(
        item =>
          `<div class="kpi"><span class="kpi-value">${item.value}</span><span class="kpi-label">${escapeHtml(item.label)}</span></div>`
      )
      .join('');

    const rowsHtml = guests
      .map((g, idx) => {
        const isAttending = g.presenza === 'confermato';
        const cucina = [g.intolleranze, g.note_chef].filter(Boolean).join(' — ');
        const nucleo = getNucleoInfo(g);
        const composizioneHtml =
          isAttending && nucleo
            ? `<strong>${nucleo.emoji} ${escapeHtml(nucleo.label)}</strong>` +
              (nucleo.companions.length > 0
                ? `<br>${nucleo.companions.map(c => escapeHtml(c)).join('<br>')}`
                : '') +
              (nucleo.childrenList.length > 0
                ? `<br>${nucleo.childrenList
                    .map(c => escapeHtml(c.age ? `${c.name} (${c.age} anni)` : c.name))
                    .join('<br>')}`
                : '') +
              `<br><em>Totale coperti: ${nucleo.total}</em>`
            : '—';
        const dedicaParts: string[] = [];
        if (g.bonifico_notificato === '1') dedicaParts.push('💳 Bonifico segnalato 🤍');
        if (g.messaggio_auguri && g.messaggio_auguri.trim()) {
          dedicaParts.push(`“${escapeHtml(g.messaggio_auguri.trim())}”`);
        }
        return `<tr class="${isAttending ? 'confirmed' : 'declined'}">
          <td class="center">${idx + 1}</td>
          <td class="name">${escapeHtml(g.nome)}</td>
          <td class="center">${isAttending ? '✓ Confermato' : '✕ Assente'}</td>
          <td class="center">${isAttending ? toInt(g.num_adulti) : '—'}</td>
          <td class="center">${isAttending ? toInt(g.num_bambini) : '—'}</td>
          <td>${composizioneHtml}</td>
          <td>${g.telefono ? escapeHtml(g.telefono) : '—'}</td>
          <td>${cucina ? escapeHtml(cucina) : '—'}</td>
          <td>${g.canzone_dj ? escapeHtml(g.canzone_dj) : '—'}</td>
          <td class="msg">${dedicaParts.length > 0 ? dedicaParts.join('<br>') : '—'}</td>
        </tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Registro Invitati — Francesca &amp; Ferdinando</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', 'Cormorant Garamond', serif;
    color: #2a2118;
    background: #fffdf8;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-hint { text-align: center; padding: 12px 8px 4px; font-family: Arial, Helvetica, sans-serif; }
  .print-hint button {
    font-size: 14px; padding: 10px 24px; border-radius: 999px; cursor: pointer;
    border: 1px solid #b08d3e; background: #6b1220; color: #f3e3b3; font-weight: 600;
  }
  .print-hint p { font-size: 11px; color: #7a6a52; margin: 6px 0 0; }
  .sheet { max-width: 273mm; margin: 0 auto; padding: 6mm 5mm 10mm; }
  header.head { text-align: center; border-bottom: 2px solid #6b1220; padding-bottom: 10px; margin-bottom: 12px; }
  .monogram { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6b1220; line-height: 1; }
  .monogram .amp { color: #b08d3e; font-style: italic; letter-spacing: 0; padding: 0 6px; }
  h1 { font-size: 20px; margin: 8px 0 3px; letter-spacing: 0.6px; color: #2a2118; }
  .subtitle { font-size: 13px; font-style: italic; color: #6b1220; margin: 3px 0; }
  .generated { font-size: 10.5px; color: #8a7a63; letter-spacing: 0.4px; margin: 4px 0 0; }
  .ornament { color: #b08d3e; font-size: 11px; letter-spacing: 5px; margin-top: 5px; }
  .kpis { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 12px 0 14px; }
  .kpi {
    flex: 1 1 100px; max-width: 170px; text-align: center;
    border: 1px solid #d8c48f; border-radius: 8px; padding: 7px 6px; background: #fdf9ef;
  }
  .kpi-value { display: block; font-size: 20px; font-weight: 700; color: #6b1220; }
  .kpi-label { display: block; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.9px; color: #7a6a52; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; table-layout: fixed; }
  thead { display: table-header-group; }
  thead th {
    background: #6b1220; color: #f3e3b3; border: 1px solid #6b1220;
    font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.7px;
    padding: 6px 4px; text-align: left;
  }
  tbody td { border: 1px solid #e0d5bb; padding: 5px 4px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
  tbody tr:nth-child(even) { background: #faf5e9; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  td.center, th.center { text-align: center; }
  td.name { font-weight: 700; font-size: 10px; }
  td.msg { font-style: italic; }
  tr.declined td { color: #a05252; }
  tr.confirmed td:nth-child(3) { color: #1e7a3c; font-weight: 700; }
  .footer-note {
    margin-top: 14px; text-align: center; font-size: 9.5px; font-style: italic; color: #8a7a63;
    border-top: 1px solid #e0d5bb; padding-top: 8px;
  }
  @media print {
    body { background: #fff; }
    .print-hint { display: none; }
    .sheet { padding: 0; max-width: none; }
  }
</style>
</head>
<body>
  <div class="print-hint">
    <button type="button" onclick="window.print()">🖨️ Stampa / Salva come PDF</button>
    <p>Da smartphone: condividi → “Stampa” → “Salva come PDF / Salva su File”. Il documento si apre automaticamente tra un istante.</p>
  </div>
  <div class="sheet">
    <header class="head">
      <div class="monogram">F <span class="amp">&amp;</span> F</div>
      <h1>Francesca Annunziata &amp; Ferdinando Paragliola</h1>
      <p class="subtitle">Registro Ufficiale Invitati &amp; Nozze — La Terra degli Aranci (7 Dicembre 2026)</p>
      <p class="generated">Report generato il ${escapeHtml(generatoIl)}</p>
      <div class="ornament">✦ ❄ ✦</div>
    </header>
    <section class="kpis">${kpiHtml}</section>
    <table>
      <colgroup>
        <col style="width:3%"><col style="width:13.5%"><col style="width:7.5%"><col style="width:4.5%">
        <col style="width:5.5%"><col style="width:17%"><col style="width:9%"><col style="width:12%"><col style="width:9.5%"><col style="width:18.5%">
      </colgroup>
      <thead>
        <tr>
          <th class="center">N.</th>
          <th>Nome e Cognome</th>
          <th class="center">Presenza</th>
          <th class="center">Adulti</th>
          <th class="center">Bambini</th>
          <th>Composizione / Accompagnatori</th>
          <th>Telefono</th>
          <th>Allergie / Note Chef</th>
          <th>Canzone DJ</th>
          <th>Messaggio / Dedica</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p class="footer-note">La Terra degli Aranci • www.laterradegliaranci.it/invito/francesca-e-ferdinando/ • Documento privato degli Sposi</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onNotify?.('Popup bloccato dal browser: consenti i popup per salvare il PDF, oppure usa Esporta CSV.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Piccolo rinvio: il browser completa il rendering prima della dialog di stampa.
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // L'utente può sempre usare il pulsante "Stampa / Salva come PDF" in pagina.
      }
    }, 400);
    onNotify?.('Documento PDF del registro invitati pronto per il salvataggio! 📄');
  };

  // Filtered guests
  const copertiTotali = (kpi?.adulti ?? 0) + (kpi?.bambini ?? 0);
  const filteredGuests = guests.filter(g => {
    const matchesSearch =
      g.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.telefono.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'confermati') return g.presenza === 'confermato';
    if (filterType === 'declinati') return g.presenza === 'declinato';
    if (filterType === 'messaggi')
      return Boolean((g.messaggio_auguri && g.messaggio_auguri.trim()) || g.bonifico_notificato === '1');
    if (filterType === 'esigenze') return Boolean(g.intolleranze || g.note_chef);
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-amalfi-card rounded-3xl border border-gold-accent/50 shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden font-sans text-wedding-charcoal">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gold-accent/20 bg-gradient-to-r from-amalfi-base via-white to-amalfi-base">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-gold-accent/20 flex items-center justify-center text-gold-dark">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-xl font-bold text-wedding-charcoal tracking-wide leading-tight">
                Area Riservata Sposi — CRM Nozze
              </h2>
              <p className="text-[10px] sm:text-[11px] text-gold-dark uppercase tracking-widest font-serif truncate">
                La Terra degli Aranci • Francesca & Ferdinando
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
            aria-label="Chiudi pannello"
          >
            ✕
          </button>
        </div>

        {!isAuthenticated ? (
          /* Login Form */
          <div className="p-8 sm:p-12 text-center max-w-sm mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-accent/30 to-gold-dark/20 text-gold-dark flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-wedding-charcoal">
                Accesso Sposi
              </h3>
              <p className="text-xs text-gray-500 font-light mt-1">
                Inserisci il codice PIN a 4 cifre per accedere alla gestione degli invitati e delle nozze.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Inserisci PIN (0712)"
                className="w-full px-4 py-3 rounded-xl border border-gold-accent/50 text-center font-mono text-2xl tracking-[0.3em] bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                autoFocus
              />

              {errorMsg && <p className="text-xs text-red-600 font-medium">{errorMsg}</p>}

              <button
                type="submit"
                disabled={isLoading || !pin}
                className="cta-primary w-full py-3.5 rounded-full font-medium text-xs uppercase tracking-widest shadow-luxury transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Verifica in corso...' : 'Entra nel CRM'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Bar + Azioni Export (layout a due righe su mobile) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 pt-3 pb-2.5 border-b border-gray-200 bg-white/70 gap-2.5">
              <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto pb-0.5 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setActiveTab('ospiti')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'ospiti'
                      ? 'bg-cta-bg text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Registro Ospiti ({kpi?.totale_ospiti ?? guests.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('jukebox')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'jukebox'
                      ? 'bg-cta-bg text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Jukebox DJ ({playlist.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('canzone')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'canzone'
                      ? 'bg-cta-bg text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Musica Invito</span>
                </button>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-wedding-charcoal transition-colors cursor-pointer"
                  title="Aggiorna dati in tempo reale"
                  aria-label="Aggiorna dati in tempo reale"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-gold-accent' : ''}`} />
                </button>
                <a
                  href={invitiApi.getExportCsvUrl(slug, pin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold-champagne/40 border border-gold-accent/40 text-gold-dark hover:bg-gold-accent hover:text-white transition-all text-xs font-semibold uppercase tracking-wider shadow-sm whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel / CSV</span>
                </a>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-wedding-burgundy border border-wedding-burgundy text-white hover:bg-[#680F1E] active:scale-95 transition-all text-xs font-semibold uppercase tracking-wider shadow-sm whitespace-nowrap cursor-pointer"
                  title="Esporta il registro invitati in PDF ad alta definizione"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Esporta PDF</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {activeTab === 'ospiti' && (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-gold-accent/30 shadow-sm text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        Ospiti Totali
                      </span>
                      <p className="font-serif text-3xl font-bold text-wedding-charcoal mt-1">
                        {kpi?.totale_ospiti ?? 0}
                      </p>
                      <p className="text-[11px] text-gold-dark mt-0.5 font-medium">
                        {kpi?.adulti ?? 0} Adulti • {kpi?.bambini ?? 0} Bambini
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-gold-accent/60 shadow-sm text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        🍽️ Coperti Totali
                      </span>
                      <p className="font-serif text-3xl font-bold text-gold-dark mt-1">
                        {copertiTotali}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Adulti + Bambini confermati
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-green-200 shadow-sm text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        Confermati
                      </span>
                      <p className="font-serif text-3xl font-bold text-green-700 mt-1">
                        {kpi?.confermati ?? 0}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {kpi?.declinati ?? 0} Declinati
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        Celiaci & Speciali
                      </span>
                      <p className="font-serif text-3xl font-bold text-amber-700 mt-1">
                        {kpi?.con_esigenze ?? 0}
                      </p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        {kpi?.celiaci ?? 0} Celiaci • {kpi?.vegetariani ?? 0} Veg
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-sm text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        Bonifici Avvisati
                      </span>
                      <p className="font-serif text-3xl font-bold text-toile-deep mt-1">
                        {kpi?.bonifici_notificati ?? 0}
                      </p>
                      <p className="text-[11px] text-toile-slate mt-0.5">
                        Notifiche IBAN ricevute
                      </p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="relative w-full sm:max-w-72">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cerca ospite o telefono..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-xs focus:outline-none focus:border-gold-accent"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 w-full">
                      {FILTERS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFilterType(f.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            filterType === f.id
                              ? 'bg-gold-accent text-white border-gold-accent shadow-xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                      {filteredGuests.length} {filteredGuests.length === 1 ? 'scheda ospite' : 'schede ospiti'} visibili
                    </p>
                  </div>

                  {/* Guests List */}
                  {filteredGuests.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-gray-200">
                      <p className="text-sm text-gray-500 font-light">
                        Nessun invitato trovato con questi criteri di ricerca.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {filteredGuests.map(g => {
                        const isAttending = g.presenza === 'confermato';
                        const adulti = toInt(g.num_adulti);
                        const bambini = toInt(g.num_bambini);
                        const hasBonifico = g.bonifico_notificato === '1';
                        const hasMessage = Boolean(g.messaggio_auguri && g.messaggio_auguri.trim());
                        const kitchenNotes = [g.intolleranze, g.note_chef].filter(Boolean).join(' — ');
                        const nucleo = getNucleoInfo(g);
                        const cleanPhone = g.telefono.replace(/\D/g, '');
                        const waUrl = cleanPhone
                          ? `https://wa.me/${cleanPhone.startsWith('39') ? cleanPhone : '39' + cleanPhone}`
                          : null;

                        return (
                          <article
                            key={g.id}
                            className="rounded-2xl bg-white border border-gold-accent/25 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex flex-col gap-3"
                          >
                            {/* Nome in risalto — serif elegante, leggibile da smartphone */}
                            <h4 className="font-serif text-xl sm:text-2xl font-bold text-wedding-charcoal leading-snug break-words">
                              {g.nome}
                            </h4>

                            {/* Badge di stato + bonifico + cucina */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                                  isAttending
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }`}
                              >
                                {isAttending
                                  ? `✓ Confermato (${adulti} ${adulti === 1 ? 'Adulto' : 'Adulti'} • ${bambini} ${
                                      bambini === 1 ? 'Bambino' : 'Bambini'
                                    })`
                                  : '✕ Non potrà esserci'}
                              </span>

                              {hasBonifico && (
                                <span className="inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  💳 Bonifico Segnalato 🤍
                                </span>
                              )}

                              {kitchenNotes && (
                                <span className="inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  ⚠️ Cucina: {kitchenNotes}
                                </span>
                              )}
                            </div>

                            {/* Composizione del nucleo — Singolo / Coppia / Famiglia */}
                            {nucleo && (
                              <div className="p-3 rounded-xl bg-amalfi-light/60 border border-gold-accent/25">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold bg-gold-champagne/50 text-gold-dark border border-gold-accent/40 uppercase tracking-wider">
                                    {nucleo.emoji} {nucleo.label}
                                  </span>
                                  <span className="inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-semibold bg-white text-wedding-charcoal border border-gold-accent/30">
                                    {nucleo.total} {nucleo.total === 1 ? 'persona' : 'persone'} ({nucleo.adults}{' '}
                                    {nucleo.adults === 1 ? 'adulto' : 'adulti'}
                                    {nucleo.children > 0 &&
                                      `, ${nucleo.children} ${nucleo.children === 1 ? 'bambino' : 'bambini'}`}
                                    )
                                  </span>
                                </div>

                                {(nucleo.companions.length > 0 || nucleo.childrenList.length > 0) && (
                                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                    {nucleo.companions.map((comp, idx) => (
                                      <li key={`comp-${idx}`} className="flex items-start gap-1.5">
                                        <span aria-hidden="true">👤</span>
                                        <span className="break-words font-medium">{comp}</span>
                                        <span className="text-gray-400 font-light">— accompagnatore</span>
                                      </li>
                                    ))}
                                    {nucleo.childrenList.map((child, idx) => (
                                      <li key={`child-${idx}`} className="flex items-start gap-1.5">
                                        <span aria-hidden="true">🧒</span>
                                        <span className="break-words font-medium">{child.name}</span>
                                        {child.age && (
                                          <span className="text-gray-400 font-light">— {child.age} anni</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {/* Recapiti */}
                            <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                              {g.telefono && <span className="break-all">📞 {g.telefono}</span>}
                              {g.email && <span className="break-all">✉️ {g.email}</span>}
                              <span className="text-[11px] text-gray-400">
                                Registrato il {new Date(g.created_at).toLocaleDateString('it-IT')}
                              </span>
                            </div>

                            {/* Dedica / messaggio di auguri ricevuto */}
                            {hasMessage && (
                              <div className="p-3 rounded-xl bg-gold-accent/10 border border-gold-accent/30 text-sm text-wedding-charcoal italic leading-relaxed break-words">
                                <span className="block mb-1 text-[10px] uppercase tracking-wider font-bold not-italic text-gold-dark">
                                  💌 Dedica ricevuta
                                </span>
                                “{g.messaggio_auguri!.trim()}”
                              </div>
                            )}

                            {/* Brano richiesto per il DJ */}
                            {g.canzone_dj && (
                              <p className="text-sm text-toile-deep font-medium italic break-words">
                                🎵 Brano per il DJ: “{g.canzone_dj}”
                              </p>
                            )}

                            {/* Azioni — touch target ≥ 44px, WhatsApp 1-tap */}
                            <div className="flex items-center gap-2 pt-2.5 border-t border-gray-100">
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all whitespace-nowrap"
                                  title={`Scrivi a ${g.nome} su WhatsApp`}
                                  aria-label={`Scrivi a ${g.nome} su WhatsApp`}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              <button
                                onClick={() => handleTogglePresence(g)}
                                className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-full border transition-colors cursor-pointer ${
                                  isAttending
                                    ? 'border-gray-200 hover:bg-red-50 text-gray-600'
                                    : 'border-gray-200 hover:bg-green-50 text-gray-600'
                                }`}
                                title={isAttending ? 'Segna come assente' : 'Segna come confermato'}
                                aria-label={
                                  isAttending
                                    ? `Segna ${g.nome} come assente`
                                    : `Segna ${g.nome} come confermato`
                                }
                              >
                                {isAttending ? (
                                  <XCircle className="w-5 h-5 text-wedding-burgundy" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteGuest(g.id, g.nome)}
                                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-full border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Elimina invitato"
                                aria-label={`Elimina ${g.nome} dall'elenco`}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'jukebox' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-wedding-charcoal">
                        Playlist DJ — Richieste degli Ospiti
                      </h3>
                      <p className="text-xs text-gray-500 font-light">
                        Tutte le canzoni richieste dai vostri invitati durante la conferma di presenza.
                      </p>
                    </div>
                    {playlist.length > 0 && (
                      <button
                        onClick={handleCopyPlaylist}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cta-bg text-white hover:bg-cta-hover transition-all text-xs font-semibold uppercase tracking-wider"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copia per il DJ</span>
                      </button>
                    )}
                  </div>

                  {playlist.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
                      <Music className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-light">
                        Nessuna canzone ancora richiesta dagli invitati.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {playlist.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white border border-gold-accent/30 shadow-xs flex items-center justify-between"
                        >
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm text-wedding-charcoal truncate">
                              🎵 {item.canzone}
                            </p>
                            <p className="text-xs text-gold-dark font-light mt-0.5">
                              Suggerita da: {item.richiesta_da}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'canzone' && (
                <div className="space-y-6 max-w-lg mx-auto py-4">
                  <div className="text-center">
                    <Volume2 className="w-10 h-10 text-gold-accent mx-auto mb-2" />
                    <h3 className="font-serif text-xl font-bold text-wedding-charcoal">
                      Canzone di Sottofondo dell'Invito
                    </h3>
                    <p className="text-xs text-gray-500 font-light mt-1">
                      Scegli la melodia romantica che parte all'apertura della busta in ceralacca.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-600">
                      Brani Romantici Consigliati:
                    </label>
                    {PRESET_SONGS.map((song, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedSongUrl === song.url
                            ? 'border-gold-accent bg-gold-champagne/20 shadow-sm'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="presetSong"
                          checked={selectedSongUrl === song.url && !customSongUrl}
                          onChange={() => {
                            setSelectedSongUrl(song.url);
                            setCustomSongUrl('');
                          }}
                          className="accent-gold-accent"
                        />
                        <span className="text-sm font-medium text-wedding-charcoal">
                          {song.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-600">
                      Oppure inserisci URL del tuo file MP3:
                    </label>
                    <input
                      type="url"
                      value={customSongUrl}
                      onChange={e => setCustomSongUrl(e.target.value)}
                      placeholder="https://.../tuo-brano.mp3"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold-accent"
                    />
                  </div>

                  <button
                    onClick={handleSaveSong}
                    disabled={isLoading}
                    className="cta-primary w-full py-3.5 rounded-full font-medium text-xs uppercase tracking-widest shadow-luxury transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Salvataggio in corso...' : 'Salva Nuova Canzone'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SposiCRM;
