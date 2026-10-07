# MASTER PLAN — IA `/admin`, Scheda Regia 360° e Registro Incassi
**Progetto:** Ecosistema TDA — La Terra degli Aranci
**Autore:** Claude Opus 5.5 (CPO / Lead System Architect)
**Data:** 07/10/2026 — **Versione:** 1.0
**Destinatari:** Mario Pepe (Creativia Studio) → implementazione DeepSeek → validazione JEV 1.13

> Questo documento si basa sulla lettura del codice reale del repository (`src/app/admin/**`, `src/lib/localDb.ts`, `src/lib/contractPayments.ts`, `src/lib/fiscalCalculator.ts`, `src/lib/servicesCatalog.ts`, `data_store.json`, `src/middleware.ts`, `src/components/DemoRoleSwitcher.tsx`). Dove cito un problema, indico il file che lo contiene.

---

## 0. SINTESI IN 10 RIGHE (per Roberto)

1. Il menu passa da **11 voci a 4 pilastri**: **Oggi · Eventi · Contratti · Cassa**. Listino e Blog vanno in una piccola sezione "Impostazioni" in fondo.
2. **Ogni numero cliccabile porta a un evento.** L'evento (ID preventivo) diventa il centro di tutto: la **Scheda Regia** `/admin/eventi/[id]`.
3. La Scheda Regia ha una **testata fissa** (sposi, data, stato, Concordato / Incassato / Residuo) e **5 schede**: Panoramica · Servizi · Cassa · Diario Sposi · Ospiti.
4. **"Contratti"** apre direttamente il modulo rapido (Data + Nomi + Canone → Blocca 7 giorni + link WhatsApp). Sotto, tre liste: Da firmare · Opzioni telefoniche · Firmati.
5. Nasce il **Registro Incassi**: ogni versamento reale (€500 contanti, €1.000 bonifico, assegno…) si registra in 2 click. Il sistema calcola da solo incassato, residuo e cosa spetta a Santo Stefano e a Iovino.
6. Le 3 rate del contratto restano come **piano teorico**; il sistema le spunta automaticamente man mano che i soldi arrivano.
7. Per Roberto e Rosaria nasce il **"Conguaglio tra società"**: chi ha incassato più del dovuto lo vede scritto, senza fogli di carta.
8. La Wedding Planner apre la **stessa scheda, ma senza le schede economiche**: i prezzi non le arrivano nemmeno al browser.
9. I vecchi indirizzi continuano a funzionare (reindirizzati).
10. Il selettore ruoli in basso a destra **non si tocca**.

---

## 1. DIAGNOSI TECNICA (cosa ho trovato nel codice)

| # | Evidenza nel codice | Effetto per Roberto |
|---|---|---|
| F1 | `src/app/admin/layout.tsx`: 11 voci piatte, nessun raggruppamento; `simulatore` e `split` sono la stessa pagina (`split/page.tsx` re-esporta `simulatore`). | Menu confuso, doppioni. |
| F2 | `AccontiClient.tsx` e `EventiCassaClient.tsx` considerano la caparra **"incassata" solo perché lo stato è `convertito`/`firmato`**. Non esiste alcun registro pagamenti nel `data_store.json`. | I numeri di cassa sono **presunti**, non reali. |
| F3 | `fiscalCalculator.computeEventCashflow` applica lo split `40_60` all'**intero** totale contratto, canone compreso. Le rate sono fisse a 1.500/3.000 e ignorano `quote.importo_caparra`. | Viola la regola aurea "fitto 100% Santo Stefano". |
| F4 | `servicesCatalog.calculateServiceSplit`: per `splitKey` sconosciuto ricade **silenziosamente** su 40/60. Tratta il prezzo come **imponibile** e aggiunge l'IVA sopra. | Rischio errori fiscali invisibili; ambiguità netto/lordo. |
| F5 | `signed_contracts[].quote_id` contiene sia UUID completi sia prefissi a 8 caratteri (`7eedebfc`) sia id demo (`quote-demo3`). `getSignedContractLocal` e `deletePendingContractLocal` fanno match per **prefisso bidirezionale**. Già oggi esiste una collisione di prefisso (`quote-de`). | Rischio di agganciare/cancellare l'evento sbagliato. |
| F6 | `wedding_diaries`: tutti e 3 i record hanno `quote_id` vuoto, agganciati solo a `client_id`. | Il Diario non è legato all'evento ("è tutto slegato"). |
| F7 | `eventi-attivi/ActiveEventsClient.tsx` e `planner/page.tsx` usano dati **mock** (`MOCK_WEDDINGS`, `INITIAL_EVENTS`). | Pagine che sembrano funzionare ma non sono collegate. |
| F8 | `catalogo/CatalogoClient.tsx` salva il listino in `localStorage` (`tda_services_catalog_v3`), mentre il server ha `services_catalog` nel `data_store.json`. | Il prezzo visto in un browser può differire da quello nell'Allegato B. |
| F9 | `localDb.getDataFilePath()`: su Vercel scrive in `/tmp/data_store.json`, che è **effimero** (si azzera al cold start). `saveStore` riscrive l'intero file senza lock. | In produzione un incasso registrato **può sparire**; scritture concorrenti (autosave Diario + incasso) possono sovrascriversi. |
| F10 | `dataHelper.getQuotesFast`: Supabase con timeout 150 ms, poi fallback locale. | Due caricamenti consecutivi possono leggere **fonti diverse** → numeri che cambiano. |
| F11 | `saveAdminQuickQuoteLocal` imposta sempre il 2° acconto (`min(3000, …)`) anche per eventi privati, mentre `computeContractFinancials` usa 0 per `eventi` se il campo è nullo. | Piani di pagamento incoerenti tra moduli. |
| F12 | Il Wedding Diary dichiara oggi **24 campi `name`** in 7 sezioni (`cliente/components/weddingDiaryFields.ts`), il brief ne cita 26. | Da allineare prima della validazione. |

---

## 2. QUESITO A — NUOVA INFORMATION ARCHITECTURE

### 2.1 Principi guida (vincolanti per il design)

1. **Un verbo per pilastro.** Oggi = *cosa devo fare*. Eventi = *chi e quando*. Contratti = *bloccare e firmare*. Cassa = *soldi*.
2. **L'evento è l'unica destinazione profonda.** Ogni riga, KPI, scadenza o notifica porta a `/admin/eventi/[id]` (eventualmente con `?tab=`).
3. **Regola dei 2 click:** da qualunque pagina, qualunque evento è raggiungibile in ≤ 2 interazioni (ricerca globale + invio).
4. **Nessuna funzione sparisce**: le pagine frammentate diventano **schede interne** di un pilastro o **sezioni della Scheda Regia**.
5. **Parole di Roberto, non di software**: niente "CRM", "Split", "Pipeline" nel menu.

### 2.2 Sidebar definitiva

```
┌──────────────────────────────┐
│  La Terra degli Aranci       │
│  [🔍 Cerca sposi o data…  ]  │  ← ricerca globale (anche Ctrl+K)
├──────────────────────────────┤
│  ☀️  Oggi                 (5) │  → /admin
│  💍  Eventi                   │  → /admin/eventi
│  ✍️  Contratti            (3) │  → /admin/contratti
│  💶  Cassa                (2) │  → /admin/cassa
├──────────── Impostazioni ────┤
│  ⚙️  Listino servizi          │  → /admin/catalogo   (rotta invariata)
│  📰  Blog                     │  → /admin/articoli   (rotta invariata)
├──────────────────────────────┤
│  RS  Roberto Sola     Esci ⏻ │
└──────────────────────────────┘
```

- I **badge numerici** sono azioni pendenti, non statistiche: Oggi = totale cose da fare; Contratti = opzioni che scadono entro 48h + firme in attesa; Cassa = rate scadute non coperte.
- Stato attivo: `pathname === href || pathname.startsWith(href + "/")` (oggi è `===`, quindi la voce si spegne nelle sottopagine).
- **Mobile**: la sidebar diventa un menu in alto (hamburger). **Vietata una tab-bar in basso**: entrerebbe in conflitto con il `DemoRoleSwitcher`.

### 2.3 I 4 pilastri in dettaglio

#### ☀️ OGGI — `/admin` (sostituisce la Dashboard attuale)
Tre colonne "da fare", ordinate per urgenza, ogni riga = 1 evento cliccabile:

| Blocco | Contenuto | Fonte |
|---|---|---|
| **Da sbloccare** | Opzioni 7gg in scadenza (≤ 48h in rosso), contratti inviati e non firmati, nuove schede visita dal tablet | `getPendingContractsLocal`, `getQuickCalendarOptionsLocal`, quote `bozza_visita` |
| **Da incassare** | Rate scadute o in scadenza entro 30 giorni, con importo mancante | `computeEventLedger` (vedi §4) |
| **In arrivo** | Prossimi 5 eventi (data, sposi, ospiti, % Diario compilato, giorni mancanti) | quote confermate |

In alto: barra azioni rapide (riuso `QuickActionsBar`): **+ Nuovo contratto · + Registra incasso · + Opzione su data**. In basso, ripiegabile: 4 KPI annuali (Concordato anno, Incassato reale, Residuo, Quota SS/Iovino).

#### 💍 EVENTI — `/admin/eventi`
Elenco unico di **tutti** gli eventi (= tutte le quote non eliminate), con interruttore di vista:

- **Vista Lista** (default) — colonne: Data · Sposi/Cliente · Formula (Esclusiva/Sala Bianca/Sala Tufo) · **Stato** · Concordato · Incassato · Residuo · Diario % · Prossima azione.
- **Vista Calendario** — riuso integrale di `CalendarioClient` (date villa + opzioni 7gg). Click su una data occupata → Scheda Regia.
- **Filtri a pillola** (sostituiscono il "CRM"): `Lead` · `Preventivi` · `Opzioni` · `In firma` · `Confermati` · `In regia (-6 mesi)` · `Svolti` · `Archiviati`. Più filtri Anno e Tipo (Wedding/Privato).

**Stato dell'evento: unico, derivato, mai salvato a mano.** Una funzione pura `deriveEventStage(quote, ctx)` in `src/lib/eventStage.ts`:

| Stato | Regola (in ordine di priorità) |
|---|---|
| `archiviato` | `status ∈ {rifiutato, opzione_convertita, eliminato}` o opzione scaduta e non firmata da > 30 gg |
| `svolto` | firmato **e** `data_evento < oggi` |
| `in_regia` | firmato **e** `data_evento − oggi ≤ 183 gg` |
| `confermato` | firmato (`status === 'firmato'` o presente in `signed_contracts`/`final_contracts` con `quote_id` **esatto**) |
| `in_firma` | link contratto generato (`fase_contratto === 'accordo_diretto'` o `status === 'convertito'`) e non firmato |
| `opzione` | `opzione.attiva === true` e non scaduta |
| `preventivo` | `status === 'inviato'` |
| `lead` | `status === 'bozza_visita'` |

Questa funzione è usata **ovunque** (lista, Oggi, badge, Scheda Regia): un solo significato per "stato".

#### ✍️ CONTRATTI — `/admin/contratti`
Struttura della pagina (dall'alto):

1. **Modulo "Nuovo contratto"** sempre aperto in testa (riuso `QuickContractPanel`), 4 campi visibili: **Data + turno · Nomi sposi · Canone · Formula**. Campi secondari (email, telefono, CF, azienda) in "Altri dati ▾". Un solo pulsante: **«Blocca la data 7 giorni e crea il link»** → mostra subito i pulsanti *WhatsApp* · *Copia link* · *Apri Scheda Evento*.
2. **Tre schede con contatore** (`?tab=`):
   - **Da firmare (n)** — contratti con link inviato. Ordinati per scadenza opzione, semaforo (verde > 3gg, giallo ≤ 3gg, rosso ≤ 48h, grigio scaduta). Azioni riga: Reinvia WhatsApp · Proroga 7gg · Rilascia data · Apri evento.
   - **Opzioni telefoniche (n)** — opzioni da calendario senza prezzo (`fase_contratto === 'opzione_rapida'`). Azione principale: **«Trasforma in contratto»** (precompila il modulo in testa, poi `markQuickOptionConvertedLocal`).
   - **Firmati (n)** — da `signed_contracts` + `final_contracts`, **uniti alla quote per `quote_id` esatto** (non più elencando il bucket R2 a caso). Colonne: Data evento · Sposi · Firmato il · PDF · Concordato · Incassato.
3. **«Da preventivo esistente»**: pulsante secondario che sostituisce la pagina `/admin/contratti/converti` (la rotta resta come redirect alla Scheda Evento → scheda Servizi → "Genera contratto").

#### 💶 CASSA — `/admin/cassa`
Quattro schede (`?tab=`), tutte alimentate dalla stessa funzione `computeEventLedger`:

| Scheda | Assorbe | Contenuto |
|---|---|---|
| **Incassi** (default) | `eventi-cassa` | Registro cronologico di tutti i pagamenti reali (data, evento, importo, metodo, incassato da). Filtro per mese/società/metodo. Totali in alto. Pulsante **+ Registra incasso** (con selettore evento). |
| **Scadenze** | `acconti` | Rate teoriche aperte: scadute (rosso), entro 30 gg, future. Ogni riga → Scheda Evento `?tab=cassa`. |
| **Società** | `split` | Per Santo Stefano e per Iovino: Spettanza totale · Incassato fisicamente · Residuo · **Conguaglio inter-società**. Esportazione CSV per il commercialista. |
| **Simulatore** | `simulatore` | Strumento invariato (riuso `SimulatoreClient`), con etichetta chiara "Simulazione — non modifica i dati". |

### 2.4 Tabella di riassorbimento (nessuna funzione persa)

| Rotta attuale | Nuova collocazione | Azione tecnica |
|---|---|---|
| `/admin` | ☀️ Oggi | Riscrittura `EnterpriseDashboardClient` |
| `/admin/contratti` | ✍️ Contratti | Ristrutturazione a schede |
| `/admin/contratti/converti` | Scheda Evento → Servizi → "Genera contratto" | Redirect |
| `/admin/eventi-cassa` | 💶 Cassa → Incassi | Redirect `/admin/cassa?tab=incassi` |
| `/admin/acconti` | 💶 Cassa → Scadenze | Redirect `/admin/cassa?tab=scadenze` |
| `/admin/split` | 💶 Cassa → Società | Redirect `/admin/cassa?tab=societa` |
| `/admin/simulatore` | 💶 Cassa → Simulatore | Redirect `/admin/cassa?tab=simulatore` |
| `/admin/crm` | 💍 Eventi (filtri stato) | Redirect `/admin/eventi` |
| `/admin/calendario` | 💍 Eventi → vista Calendario | Redirect `/admin/eventi?vista=calendario` |
| `/admin/preventivi` | 💍 Eventi (filtro Preventivi) | Redirect `/admin/eventi?stato=preventivo` |
| `/admin/preventivi/nuovo` | Azione "+ Nuovo preventivo analitico" in Eventi | Rotta invariata |
| `/admin/preventivi/[id]/modifica-servizi` | Scheda Evento → Servizi | Redirect `/admin/eventi/[id]?tab=servizi` |
| `/admin/eventi-attivi` (mock chat) | Rimosso dal menu. La messaggistica futura vivrà nella Scheda Evento | Redirect `/admin/eventi?stato=in_regia` |
| `/admin/wedding-diary` | Scheda Evento → Diario Sposi; colonna "Diario %" in Eventi | Redirect `/admin/eventi?stato=in_regia` |
| `/admin/catalogo`, `/admin/articoli` | Impostazioni | Invariate |

**Redirect**: in `next.config` (`redirects()`), con `permanent: false` per i primi 60 giorni (307), poi 308. I redirect verso la Scheda Evento con `[id]` richiedono un `page.tsx` che chiama `redirect()` (dinamico).

---

## 3. QUESITO B — SCHEDA REGIA 360° `/admin/eventi/[id]`

### 3.1 Struttura visiva

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Eventi    MARCO & SOFIA ESPOSITO           [● Confermato]  -164 giorni│
│ Sab 20 Marzo 2027 · Cena 19:30 · Esclusiva · 120 ospiti                 │
│ ┌──────────────┬──────────────┬──────────────┬────────────────────────┐ │
│ │ Concordato   │ Incassato    │ Residuo      │ Prossima scadenza      │ │
│ │ € 21.000,00  │ € 4.500,00   │ € 16.500,00  │ Saldo · 20/03/2027     │ │
│ └──────────────┴──────────────┴──────────────┴────────────────────────┘ │
│ [+ Registra incasso]  [💬 WhatsApp sposi]  [📄 Contratto PDF]   [⋯]     │
├────────────────────────────────────────────────────────────────────────┤
│  Panoramica │ Servizi │ Cassa (!) │ Diario Sposi 62% │ Ospiti           │
├────────────────────────────────────────────────────────────────────────┤
│                       contenuto della scheda attiva                      │
└────────────────────────────────────────────────────────────────────────┘
```

Regole:
- **Testata sticky**, identica su tutte le schede: Roberto non perde mai il "colpo d'occhio".
- Le schede sono un **parametro URL** (`?tab=panoramica|servizi|cassa|diario|ospiti`), così sono linkabili da Oggi/Cassa e il tasto Indietro funziona. Default: `panoramica`.
- Indicatori sulle schede: `(!)` su Cassa se c'è una rata scaduta; `%` su Diario; numero celiaci/allergie su Ospiti; "1 modifica da firmare" su Servizi.
- Il pulsante **+ Registra incasso** è nella testata (mai un bottone flottante in basso a destra → conflitto con `DemoRoleSwitcher`). Apre un pannello laterale (drawer) a 4 campi.
- `params` e `searchParams` sono **Promise** in Next.js 16: `const { id } = await params;` (verificare in `node_modules/next/dist/docs/` come da `AGENTS.md`).
- `id` accettato **solo** come UUID completo (o id legacy esatto). Nessuna risoluzione per prefisso. Id inesistente → `notFound()`.

### 3.2 Le 5 schede

#### 1) Panoramica & Dati Regia
| Blocco | Contenuto |
|---|---|
| Intestatari | Nome/cognome di entrambi, telefono e email (tap-to-call / WhatsApp), tipo cliente (privato/azienda + P.IVA/SDI/PEC se azienda). |
| Evento | Data, turno e orari (12:30 / 19:30 da `turnoTime`), formula esclusiva/semi-esclusiva, spazi riservati, numero ospiti, provenienza lead. |
| Contratto | Stato firma, data firma, **PDF firmato da R2** (link via `/api/pdf/[id]`), Allegati B firmati (elenco da `quote_changes` confermati, ognuno col suo PDF), stato opzione e scadenza. |
| Note | Note visita segreteria (tablet), note interne direzione. |
| Registro attività | Ripiegabile: timeline (creato, opzione, link inviato, firmato, incassi, modifiche servizi, diario aggiornato) costruita dai timestamp esistenti. |
| Azioni | Modifica dati anagrafici · Proroga opzione · Rilascia data · Accesso Area Sposi (genera/reinvia credenziali). |

#### 2) Servizi & Preventivo Dinamico
- Tabella righe servizi: Servizio · Quantità · Prezzo unitario (**snapshot** al momento dell'inserimento) · Totale riga · Società (SS / Iovino / misto, da `splitKey`).
- In testa: **Canone fitto** (riga fissa, 100% Santo Stefano).
- Sconto (importo fisso o %), con motivazione obbligatoria.
- Tre totali sempre distinti e con etichette esplicite:
  - **Totale firmato** (contratto + Allegati B confermati) — è il *Concordato* usato dalla Cassa.
  - **In attesa di firma** (+/- delta dell'Allegato B pending).
  - **Bozza in corso** (modifiche non ancora inviate).
- Flusso: "Aggiungi dal listino" (catalogo server, 129 voci, ricerca) → "Genera Allegato B" → crea `quote_change` pending + link firma per gli sposi → alla firma il Concordato si aggiorna e la rata *Saldo* si ricalcola.
- Solo la Direzione modifica (direttiva Roberto). Gli sposi **vedono** e **firmano**, non aggiungono.
- Se lo stato è `preventivo`/`opzione`: pulsante **"Genera contratto"** (sostituisce `/admin/contratti/converti`).

#### 3) Flusso di Cassa & Incassi Reali
```
 PIANO CONTRATTUALE                         INCASSI REALI
 ┌───────────────────────────────────┐      ┌─────────────────────────────────────────┐
 │ ✅ Caparra     € 1.500  alla firma │      │ 10/01 € 500   Contanti  → Santo Stefano  │
 │ ✅ 2° acconto  € 3.000  20/09/2026 │      │ 01/02 € 1.000 Bonifico  → Santo Stefano  │
 │ ⏳ Saldo      € 16.500  20/03/2027 │      │ 01/05 € 3.000 Bonifico  → Iovino         │
 └───────────────────────────────────┘      │ 01/06 € 200   Assegno   ANNULLATO (motivo)│
                                            └─────────────────────────────────────────┘
 RIPARTIZIONE SOCIETÀ
 ┌──────────────────┬─────────────┬───────────────┬──────────────┐
 │                  │ Spettanza   │ Incassato     │ Residuo      │
 │ Santo Stefano    │ € 13.526,13 │ € 1.500,00    │ € 12.026,13  │
 │ Iovino Banqueting│ €  7.473,87 │ € 3.000,00    │ €  4.473,87  │
 │ Conguaglio       │ nessuno — nessuna società ha incassato oltre la sua spettanza │
 └──────────────────┴─────────────┴───────────────┴──────────────┘
```
- **+ Registra incasso**: Data (default oggi) · Importo · Metodo · Incassato da (SS/Iovino, preselezionato in base alla prossima rata) · Riferimento (CRO/n° assegno, opzionale) · Note.
- Un incasso **non si cancella**: si **annulla** con motivo (resta visibile barrato). Solo Direzione.
- Avviso (non blocco) se un singolo incasso in contanti ≥ € 5.000 (soglia di legge vigente: da confermare col commercialista).
- Avviso se l'incassato supera il Concordato (eccedenza).

#### 4) Preferenze Sposi (Wedding Diary)
- Lettura **in tempo reale** delle risposte, raggruppate nelle 7 sezioni di `weddingDiaryFields.ts` (Giorno · Inviti e Rito · Preparativi · Stile e Sapori · Musica · Su misura · Gran finale).
- Barra di completamento per sezione + "ultimo aggiornamento: 2 ore fa".
- Campi vuoti mostrati come "— non ancora compilato" (mai nascosti: Roberto deve vedere cosa manca).
- **Sola lettura** per la Direzione e la Planner (il Diario è degli sposi). Pulsante "Stampa scheda regia" (PDF per lo staff).
- Fonte: diario cercato per **`quote_id`** (vedi migrazione §5, R2).

#### 5) Ospiti & Intolleranze
- Contatori grandi per la cucina Iovino: **Adulti · Bambini · Celiaci · Vegani/Vegetariani · Allergie (con dettaglio) · Fornitori/staff da servire**.
- Elenco dettagliato delle esigenze alimentari (nome ospite, tavolo, esigenza).
- Fonte: `GuestManager` dell'area cliente + `dietary_notes` del diario. Se assente: inserimento manuale da Direzione/Planner.
- Pulsante **"Scheda cucina per Iovino"** (PDF/stampa senza prezzi, condivisibile con Rosaria).

### 3.3 Segregazione ruoli — una scheda, tre proiezioni

| Sezione | Direzione `/admin/eventi/[id]` | Planner `/planner/eventi/[id]` | Sposi `/cliente` |
|---|---|---|---|
| Testata economica (Concordato/Incassato/Residuo) | ✅ | ❌ (assente dal DOM e dal payload) | Solo rate e "già versato" totale |
| Panoramica | ✅ completa | ✅ senza contratto/PDF/importi | — |
| Servizi | ✅ con prezzi | Elenco servizi **senza prezzi** (serve per la regia) | Elenco + firma Allegato B |
| Cassa | ✅ | ❌ (scheda inesistente, rotta 404) | Solo le proprie rate |
| Diario | ✅ lettura | ✅ lettura | ✅ scrittura (autosave) |
| Ospiti | ✅ | ✅ lettura/scrittura | ✅ scrittura |

**Implementazione obbligatoria:** la segregazione si fa **sul server**, con funzioni di proiezione esplicite (whitelist):
`toAdminEventDTO(event)`, `toPlannerEventDTO(event)`, `toClientEventDTO(event)` in `src/lib/eventDto.ts`.
Il DTO planner **non contiene** le chiavi `prezzo`, `totale`, `totale_calcolato`, `importo_*`, `payments`, `pdf_url`, `iban`, `sconto_*`, `prezzo_unitario`. Nascondere con CSS o con `{role === 'admin' && …}` su dati già passati al client **non è ammesso** (finirebbero comunque nel payload RSC).

---

## 4. QUESITO C — MODELLO DATI: REGISTRO INCASSI & SPLIT

### 4.1 Decisioni di modellazione

1. **Collezione separata** `payments[]` al livello radice dello store (non annidata dentro la quote): mappa 1:1 su una futura tabella Supabase, evita di riscrivere la quote ad ogni incasso, consente il registro globale in Cassa.
2. **Append-only**: nessuna cancellazione fisica; l'annullamento è un cambio di stato con motivo.
3. **Importi in centesimi interi** (`importo_cents: number`), mai float. Conversione in euro solo in visualizzazione con `formatEuro` (già deterministica, evita mismatch di idratazione).
4. **Date** come stringhe `YYYY-MM-DD` confrontate come stringhe (niente `new Date('2026-10-07')` che slitta di fuso).
5. **Chiave = `quote_id` UUID completo.** Mai email, mai prefisso.
6. **Piano rate = derivato**, non salvato come record separato. Si basa sui campi già congelati alla firma (`importo_caparra`, `importo_secondo_acconto` via `freezeInstallmentsLocalByPrefix`) e sul Concordato corrente.

### 4.2 Tipi (`src/lib/eventLedger.ts`)

```ts
export type PaymentMethod = 'bonifico' | 'contanti' | 'assegno' | 'carta' | 'altro';
export type Company = 'santo_stefano' | 'iovino';

export interface Payment {
  id: string;                 // uuid
  quote_id: string;           // UUID completo della quote (FK)
  data_incasso: string;       // 'YYYY-MM-DD'
  importo_cents: number;      // intero > 0
  metodo: PaymentMethod;
  incassato_da: Company;      // società che ha materialmente ricevuto il denaro
  riferimento?: string;       // CRO, n° assegno, ecc.
  note?: string;
  stato: 'valido' | 'annullato';
  annullato_motivo?: string;
  annullato_at?: string;      // ISO
  registrato_da: string;      // username sessione (es. 'admin')
  created_at: string;         // ISO
}

export interface Installment {
  key: 'caparra' | 'secondo_acconto' | 'saldo';
  label: string;
  importo_cents: number;
  scadenza: string | null;    // 'YYYY-MM-DD'
  coperto_cents: number;      // quanto di questa rata è coperto (FIFO)
  stato: 'saldata' | 'parziale' | 'da_pagare' | 'scaduta';
  in_ritardo: boolean;        // non saldata e scadenza < oggi
}

export interface EventLedger {
  concordato_cents: number;          // canone + servizi firmati − sconti (Allegati B pending esclusi)
  in_attesa_firma_delta_cents: number;
  spettanza: Record<Company, number>;   // quota del concordato per società (lordo)
  incassato_cents: number;              // somma pagamenti validi
  incassato_per: Record<Company, number>;
  residuo_cents: number;                // max(0, concordato − incassato)
  residuo_per: Record<Company, number>; // spettanza − incassato_per (può essere < 0)
  conguaglio: { da: Company; a: Company; importo_cents: number } | null;
  eccedenza_cents: number;              // max(0, incassato − concordato)
  rate: Installment[];
  prossima_scadenza: Installment | null;
  avvisi: string[];                     // es. 'CONTANTI_SOGLIA', 'ECCEDENZA', 'SPLITKEY_SCONOSCIUTA'
}

export function computeEventLedger(
  quote: Quote, payments: Payment[], confirmedChanges: QuoteChange[], pendingChanges: QuoteChange[],
  today: string /* 'YYYY-MM-DD' */
): EventLedger;
```

**Una sola funzione pura**, usata da: testata Scheda Evento, scheda Cassa evento, pagina Cassa, Oggi, badge sidebar, `PaymentSchedule` dell'area sposi (che riceve solo `rate`, `incassato_cents`, `residuo_cents`). Nessun altro file ricalcola incassi o split.

### 4.3 Algoritmi

**A. Concordato.** `concordato = canone + Σ righe servizi firmate − sconto`, dove "firmate" = righe del contratto + righe degli Allegati B con `status === 'confermato'`. Gli Allegati B `pending` alimentano solo `in_attesa_firma_delta_cents`.

**B. Spettanza per società.** Per ogni componente del concordato:
- Canone → 100% Santo Stefano (regola aurea, nessuna eccezione).
- Riga servizio → regola del suo `splitKey` **snapshot** (salvato sulla riga al momento dell'inserimento, così una modifica futura del listino non cambia i conti di contratti già firmati).
- Sconto → ripartito pro-quota sulle righe a cui si applica (default: sui servizi, non sul canone — **decisione D3**).
- `splitKey` sconosciuto → **nessun fallback silenzioso**: si applica 40/60 ma si aggiunge l'avviso `SPLITKEY_SCONOSCIUTA` visibile in testata.

**C. Netto/lordo (decisione D1, raccomandazione).** Per un contratto con consumatori i prezzi esposti devono essere **IVA inclusa**. Raccomando: *tutti gli importi di contratto, Allegato B e incassi sono lordi*; lo split avviene per **scorporo**. Nuova funzione `splitGross(lordo_cents, splitKey)` (la legacy `calculateServiceSplit` resta invariata per simulatore/catalogo):
- `ss100`: SS = lordo.
- `i100`: Iovino = lordo.
- `40_60`: imponibile `N = lordo / (0,40×1,22 + 0,60×1,10) = lordo / 1,148`; `SS = round(0,488 × N)`; **Iovino = lordo − SS** (il resto garantisce che la somma torni al centesimo).
- `ss100fixed` / `ss50` / `ss25`: SS imponibile = min(N, soglia) con soglia 100/50/25 → se `lordo ≤ soglia×1,22`: SS = lordo; altrimenti `SS = soglia×1,22`, Iovino = lordo − SS.
- `after_party`: formula analoga a quella in `calculateServiceSplit`, invertita; Iovino sempre come resto.

> Nota per Roberto e Rosaria: "40/60" è sull'**imponibile**. Sul **lordo incassato** la quota di Santo Stefano è circa **42,5%** e quella di Iovino circa **57,5%**, perché le aliquote IVA sono diverse (22% vs 10%). Il sistema lo mostra in automatico.

**D. Riconciliazione rate ↔ incassi (FIFO cumulativo).** Nessuna assegnazione manuale del pagamento a una rata.
```
cumulato = Σ pagamenti validi (ordinati per data_incasso, poi created_at)
soglia_i = Σ importi delle rate 1..i
coperto_i = clamp(cumulato − soglia_{i−1}, 0, importo_i)
stato_i:
  coperto_i == importo_i                 → 'saldata'
  coperto_i > 0                          → 'parziale'   (anche se scaduta: il ritardo si segnala col flag in_ritardo)
  coperto_i == 0 e scadenza < oggi       → 'scaduta'
  altrimenti                             → 'da_pagare'
in_ritardo_i = (stato_i != 'saldata') && scadenza_i < oggi
```
- Rate: Caparra (`importo_caparra`, scadenza = data firma), 2° acconto (`importo_secondo_acconto`, scadenza = `sixMonthsBefore(data_evento)`; omessa se 0), Saldo (= concordato − caparra − 2° acconto, scadenza = `data_evento`).
- Se un Allegato B aumenta il concordato, **cambia solo il Saldo**; caparra e 2° acconto restano congelati.
- Rata con importo 0 → non mostrata.

**E. Ripartizione dell'incassato e conguaglio.**
- `incassato_per[società]` = somma dei pagamenti validi con quell'`incassato_da` (denaro **realmente** entrato in quella società).
- `residuo_per[società] = spettanza[società] − incassato_per[società]`.
- Se una società ha `residuo_per < 0` (ha incassato oltre la sua spettanza totale), allora `conguaglio = { da: quella società, a: l'altra, importo: |residuo_per| }`. È il numero che Roberto e Rosaria devono regolare tra loro.
- Questo approccio **non richiede alcuna politica di allocazione** dei pagamenti: è deterministico e verificabile.

### 4.4 Persistenza e operazioni

- `LocalStore.payments?: Payment[]` (+ inizializzazione in `getStore()` come le altre collezioni).
- Funzioni nuove in `localDb.ts`: `addPaymentLocal`, `voidPaymentLocal`, `getPaymentsForQuoteLocal`, `getAllPaymentsLocal`. Nessuna funzione esistente viene modificata nella firma.
- Server Actions in `src/app/admin/eventi/[id]/paymentActions.ts`:
  - `registerPaymentAction(quoteId, input)` — verifica ruolo `admin` lato server (sessione, non solo middleware), quote esistente per **id esatto**, `importo_cents` intero > 0, data valida (`YYYY-MM-DD`, non oltre oggi+1), metodo ed `incassato_da` nei valori ammessi.
  - `voidPaymentAction(paymentId, motivo)` — motivo obbligatorio (≥ 3 caratteri), solo pagamenti `valido`.
  - Entrambe chiamano `revalidateEvent(quoteId)` (helper unico che invalida `/admin`, `/admin/eventi`, `/admin/eventi/${id}`, `/admin/cassa`, `/cliente`).
- **Supabase (produzione):** tabella `payments` con FK `quote_id → quotes.id`, `CHECK (importo_cents > 0)`, indice su `(quote_id, data_incasso)`, RLS: insert/update solo admin; nessuna policy `DELETE`.

### 4.5 Migrazione eventi esistenti (retrocompatibilità)

- Gli eventi già firmati **non ricevono pagamenti inventati**. In testata compare il banner: *"Incassi storici non registrati — la caparra è stata incassata?"* con pulsante **[Sì, registra € 1.500]** (1 click, crea un `Payment` con `note: 'Registrazione storica'`) e **[No]** (nasconde il banner per quell'evento).
- Le pagine Cassa mostrano un contatore "N eventi con incassi da verificare" finché non sono tutti confermati.

---

## 5. QUESITO D — NODI TECNICI, RISCHI E RIMEDI ALLA RADICE

| ID | Rischio | Gravità | Rimedio |
|---|---|---|---|
| R1 | **Persistenza effimera su Vercel** (`/tmp/data_store.json`, F9): un incasso registrato in produzione può sparire al cold start. | 🔴 Bloccante | I pagamenti in produzione vanno **solo su Supabase** (scrittura sincrona, errore esplicito se fallisce, nessun fallback silenzioso su JSON). Il JSON resta per sviluppo/demo locale. Indicatore "Dati: Supabase / Locale-demo" nel footer della sidebar. |
| R2 | **Race condition JSON**: `saveStore` riscrive l'intero file; autosave del Diario + registrazione incasso nello stesso istante → perdita dati. | 🔴 | Scrittura atomica (file temporaneo + `rename`) + mutex in-process + rilettura dello store **dentro** la sezione critica. In produzione: tabelle separate Supabase. |
| R3 | **ID per prefisso** (F5): collisioni (`quote-de` già presente), cancellazioni bidirezionali in `deletePendingContractLocal`. | 🔴 | Funzione unica `resolveQuoteId(input)` → restituisce l'id esatto o errore `AMBIGUO`/`NON_TROVATO`. Il nuovo codice (Scheda Evento, payments) usa **solo id esatti**. Migrazione: normalizzare `signed_contracts[].quote_id` al UUID completo quando il prefisso è univoco; elenco "da verificare" per i casi ambigui. Il prefisso a 8 caratteri resta **solo** come numero preventivo visualizzato e nel link firmato (`sig`) già distribuito. |
| R4 | **Diario non collegato all'evento** (F6). Un cliente con due eventi vedrebbe lo stesso diario. | 🟠 | `saveWeddingDiaryLocal` deve sempre scrivere `quote_id`. Migrazione: se il `client_id` ha **una sola** quote wedding → collega; altrimenti elenco "Diari da collegare" in Eventi. Lettura in Scheda Evento: prima per `quote_id`, poi fallback `client_id` solo se univoco. |
| R5 | **Split sbagliato sul canone** (F3) e fallback 40/60 silenzioso (F4). | 🟠 | Nuova `splitGross` + `computeEventLedger`; `computeEventCashflow` deprecata (non più importata dalle pagine). Avviso `SPLITKEY_SCONOSCIUTA`. |
| R6 | **Incassi presunti** (F2) nelle vecchie pagine Acconti/Cassa. | 🟠 | Le nuove pagine leggono **solo** `payments`. Nessun "incassato" deriva dallo `status`. |
| R7 | **Disallineamento Allegato B**: totale calcolato nel browser (`ModificaServiziForm`) e salvato così com'è; listino in `localStorage` (F8). | 🟠 | Il server **ricalcola** `totale_after` dalle righe usando il catalogo server; le righe salvano `prezzo_unitario` e `splitKey` **snapshot**; se il totale inviato dal client differisce → rifiuto. Il PDF dell'Allegato B usa lo stesso calcolo. `CatalogoClient` smette di usare `localStorage` come fonte (al massimo cache di sola lettura). |
| R8 | **Doppia fonte dati** (F10): Supabase con timeout 150 ms o JSON → numeri diversi tra due refresh. | 🟠 | Per le letture economiche: fonte unica configurata da env (`TDA_DATA_SOURCE=supabase|local`), niente commutazione per timeout. Timeout più ampio e stato d'errore visibile. |
| R9 | **Cache Next.js 16**: pagine non aggiornate dopo un incasso o una firma. | 🟡 | Tutte le pagine economiche `dynamic`/`revalidate = 0` (come oggi); helper unico `revalidateEvent(id)` chiamato da **ogni** server action che tocca quote, payments, quote_changes, diari, firme. Verificare API `revalidatePath`/`updateTag` nei docs locali di Next 16 prima di scrivere codice. |
| R10 | **Next.js 16 – convenzioni**: `params`/`searchParams` asincroni; `middleware.ts` potrebbe essere deprecato a favore di `proxy.ts`. | 🟡 | Leggere `node_modules/next/dist/docs/` (regola `AGENTS.md`). Non rinominare il middleware in questo lavoro se non necessario: fuori scope. |
| R11 | **Fuga di prezzi verso la Planner** quando `/planner` passerà da mock a dati reali. | 🔴 | DTO whitelist server-side (§3.3). Test: il payload HTML/RSC di `/planner/eventi/[id]` non contiene `prezzo`, `importo`, `totale`, `iban`, `payments`. |
| R12 | **IDOR area sposi**: `/cliente?id=…` legge l'id dall'URL. | 🟠 | L'evento mostrato è determinato dalla sessione (`clientId`/`quote_id` nel token), non dal parametro. Il parametro resta solo in modalità demo con ruolo admin. |
| R13 | **Cancellazione contratto pending con incassi**: `deletePendingContractLocal` rimuove la quote → pagamenti orfani. | 🟠 | Bloccare l'eliminazione se esistono pagamenti validi; preferire `status: 'eliminato'` (soft delete). |
| R14 | **Conflitto visivo col `DemoRoleSwitcher`** (fisso in basso a destra). | 🟡 | Nessun elemento fisso nel quadrante in basso a destra; drawer laterale con `z-index` inferiore al selettore; padding inferiore del `main` ≥ altezza del selettore. |
| R15 | **Incoerenza 2° acconto eventi privati** (F11). | 🟡 | Una sola regola, in `computeContractFinancials`; `saveAdminQuickQuoteLocal` la riusa (decisione D4). |
| R16 | **Idratazione**: `toLocaleString` server/client diversi. | 🟡 | Usare `formatEuro` e `formatItalianDate` di `contractPayments.ts` ovunque nei nuovi componenti. |
| R17 | **Campi Diario 24 vs 26** (F12). | 🟡 | Allineare la specifica prima dei test; i test JEV leggono il numero da `weddingDiaryFields.ts`, non da una costante scritta a mano. |

---

## 6. PIANO DI IMPLEMENTAZIONE PER DEEPSEEK (fasi, ognuna = 1 PR verificabile)

| Fase | Contenuto | Uscita verificabile |
|---|---|---|
| **0. Decisioni** | Roberto/commercialista confermano D1–D6 (sotto). | Documento decisioni firmato da Mario. |
| **1. Motore** | `eventLedger.ts` (+ `splitGross`), `eventStage.ts`, `eventDto.ts`, `resolveQuoteId`; collezione `payments` + funzioni localDb; scrittura atomica JSON; test unitari con i vettori §7.3. | Test verdi, nessuna UI cambiata. |
| **2. Scheda Regia** | `/admin/eventi/[id]` con testata + 5 schede; server actions incassi; banner migrazione. | Scheda navigabile per ogni quote esistente. |
| **3. Navigazione** | Nuova sidebar 4+2, ricerca globale, `/admin/eventi` (lista + calendario), `/admin/cassa` a 4 schede, `/admin/contratti` a schede, redirect. | Tutte le vecchie rotte reindirizzano. |
| **4. Oggi** | Nuovo cruscotto alimentato da `deriveEventStage` + `computeEventLedger`. | Ogni riga porta alla Scheda Regia. |
| **5. Ruoli** | `/planner/eventi/[id]` con `toPlannerEventDTO`; `PaymentSchedule` sposi alimentato dal ledger. | Test di segregazione verdi. |
| **6. Migrazioni** | Normalizzazione `signed_contracts.quote_id`, collegamento diari, eliminazione `localStorage` catalogo, deprecazione `computeEventCashflow`. | Report migrazione (collegati / ambigui). |

### Decisioni richieste a Roberto (D1–D6)
- **D1** Gli importi di contratto e listino sono **IVA inclusa**? *(Raccomandato: sì, scorporo automatico.)*
- **D2** Chi incassa di norma ogni rata? *(Proposta di preselezione: Caparra → Santo Stefano; 2° acconto → Iovino; Saldo → scelta manuale.)*
- **D3** Gli sconti si applicano solo ai servizi o anche al canone?
- **D4** Gli eventi privati hanno il 2° acconto? *(Oggi due moduli dicono cose diverse.)*
- **D5** La segreteria può registrare incassi? *(Raccomandato: no, solo Direzione.)*
- **D6** La Planner potrà proporre bozze di servizi? *(Fuori scope ora; l'architettura DTO lo consente in futuro senza esporre prezzi.)*

---

## 7. QUESITO E — BATTERIA DI VALIDAZIONE JEV 1.13

Formato: **ID · Domanda (risposta attesa) · Metodo di verifica**. Ogni criterio è binario (SÌ/NO) o puntuale (valore esatto). Un solo NO = implementazione non conforme.

### 7.1 Navigazione e IA (NAV)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| NAV-01 | La sidebar contiene esattamente 4 voci principali con etichette `Oggi`, `Eventi`, `Contratti`, `Cassa`, in quest'ordine? (SÌ) | Ispezione `admin/layout.tsx` / DOM |
| NAV-02 | Sotto il separatore "Impostazioni" ci sono esattamente `Listino servizi` e `Blog`? (SÌ) | DOM |
| NAV-03 | Le stringhe `CRM`, `Split`, `Simulatore Fiscale`, `Contratti Rapidi`, `Eventi Attivi & Chat` sono assenti dalla sidebar? (SÌ) | grep su layout |
| NAV-04 | La voce attiva resta evidenziata su `/admin/eventi/<uuid>`? (SÌ) | Navigazione |
| NAV-05 | Ognuna delle rotte `/admin/eventi-cassa`, `/admin/acconti`, `/admin/split`, `/admin/simulatore`, `/admin/crm`, `/admin/calendario`, `/admin/preventivi`, `/admin/eventi-attivi`, `/admin/wedding-diary`, `/admin/contratti/converti` risponde con redirect (307/308) verso la destinazione della tabella §2.4? (SÌ, 10/10) | `curl -I` con sessione admin |
| NAV-06 | `/admin/preventivi/<uuid>/modifica-servizi` reindirizza a `/admin/eventi/<uuid>?tab=servizi` mantenendo lo stesso uuid? (SÌ) | `curl -I` |
| NAV-07 | La ricerca globale trova un evento digitando il cognome e lo apre con Invio (≤ 2 interazioni)? (SÌ) | Test UI |
| NAV-08 | Su viewport 390px non esiste alcuna barra di navigazione fissa in basso? (SÌ) | Test UI mobile |
| NAV-09 | Le funzionalità di Simulatore, Calendario, Catalogo e Approvazione Blog sono ancora raggiungibili e funzionanti? (SÌ, 4/4) | Navigazione |

### 7.2 Contratti (CTR)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| CTR-01 | Il titolo della pagina è "Contratti" (non "Contratti Rapidi")? (SÌ) | DOM |
| CTR-02 | Il modulo di creazione rapida è visibile senza click all'apertura della pagina? (SÌ) | UI |
| CTR-03 | I campi obbligatori visibili del modulo sono esattamente: Data+turno, Nomi, Canone, Formula? (SÌ) | UI |
| CTR-04 | Dopo l'invio, la quote creata ha `opzione.attiva === true` e `opzione.scadenza` = creazione + 7 giorni (±1 min)? (SÌ) | Ispezione store |
| CTR-05 | Dopo l'invio compaiono i pulsanti WhatsApp, Copia link e Apri Scheda Evento, e quest'ultimo apre `/admin/eventi/<id-creato>`? (SÌ) | UI |
| CTR-06 | Esistono le schede `Da firmare`, `Opzioni telefoniche`, `Firmati`, ciascuna con contatore uguale al numero di righe mostrate? (SÌ) | UI |
| CTR-07 | Una data già bloccata (stesso giorno e turno, formula incompatibile) non è prenotabile due volte? (SÌ, errore esplicito) | Test funzionale |
| CTR-08 | La scheda Firmati abbina ogni PDF alla quote tramite `quote_id` esatto e mostra Concordato e Incassato? (SÌ) | Codice + UI |
| CTR-09 | "Trasforma in contratto" su un'opzione telefonica porta la quote originale a `status: 'opzione_convertita'` con `opzione.convertita_in` = id nuovo? (SÌ) | Store |
| CTR-10 | Non è possibile eliminare un contratto che ha almeno un pagamento valido? (SÌ, bloccato) | Test funzionale |

### 7.3 Motore economico (LED) — vettori deterministici
Ipotesi: D1 = importi IVA inclusa. Data di riferimento `today = '2026-10-07'`.

**Vettore V1** — canone € 8.000 (`ss100`); servizi € 13.000 lordi (`40_60`); caparra € 1.500; 2° acconto € 3.000; data evento `2027-03-20`. Pagamenti: `2026-01-10` € 500 contanti → SS; `2026-02-01` € 1.000 bonifico → SS; `2026-05-01` € 3.000 bonifico → Iovino; `2026-06-01` € 200 assegno → SS **annullato**.

| ID | Grandezza | Atteso |
|---|---|---|
| LED-01 | `concordato_cents` | 2.100.000 |
| LED-02 | `spettanza.santo_stefano` | 1.352.613 |
| LED-03 | `spettanza.iovino` | 747.387 |
| LED-04 | `spettanza.ss + spettanza.iovino === concordato` | SÌ |
| LED-05 | `incassato_cents` (annullato escluso) | 450.000 |
| LED-06 | `residuo_cents` | 1.650.000 |
| LED-07 | `incassato_per.santo_stefano` / `incassato_per.iovino` | 150.000 / 300.000 |
| LED-08 | `residuo_per.santo_stefano` / `residuo_per.iovino` | 1.202.613 / 447.387 |
| LED-09 | `conguaglio` | `null` |
| LED-10 | Stati rate [caparra, 2° acconto, saldo] | [`saldata`, `saldata`, `da_pagare`] |
| LED-11 | Importo e scadenza Saldo | 1.650.000 · `2027-03-20` |
| LED-12 | Scadenza 2° acconto | `2026-09-20` |

**Vettore V2** — come V1 ma con il solo pagamento da € 500: stati rate = [`parziale`, `scaduta`, `da_pagare`]; `coperto` caparra = 50.000; `in_ritardo` = [true, true, false] (caparra con scadenza = data firma nel passato). *(LED-13)*

**Vettore V3** — canone € 5.000 `ss100`, nessun servizio, caparra € 1.500, 2° acconto 0, evento `2026-12-12`. Pagamenti € 1.500 + € 4.000 (entrambi → SS). Atteso: `incassato` 550.000; `residuo` 0 (mai negativo); `eccedenza` 50.000; avviso `ECCEDENZA` presente; nessuna rata `secondo_acconto` nell'elenco. *(LED-14)*

**Vettore V4** — V1 + Allegato B `pending` +€ 1.200 (`40_60`): `concordato` resta 2.100.000; `in_attesa_firma_delta_cents` = 120.000. Dopo conferma: `concordato` = 2.220.000; Saldo = 1.770.000; caparra e 2° acconto invariati. *(LED-15, LED-16)*

**Vettore V5** — Conguaglio: canone € 3.000 `ss100`, servizi € 1.148 `40_60` (SS 48.800 / Iovino 66.000 cents); pagamenti totali € 4.148 tutti → SS. Atteso: `residuo_per.iovino` = 66.000 (non pagato a Iovino); `residuo_per.santo_stefano` = −66.000; `conguaglio = { da: 'santo_stefano', a: 'iovino', importo_cents: 66.000 }`. *(LED-17)*

| ID | Criterio strutturale | Atteso |
|---|---|---|
| LED-18 | Esiste un'unica funzione `computeEventLedger` e **nessun altro file** in `src/app/**` calcola incassato/residuo/split in proprio? | SÌ (grep su `0.4`, `0.6`, `1500`, `3000` nei componenti admin = 0 occorrenze di calcolo) |
| LED-19 | Il canone è sempre 100% Santo Stefano in tutti i vettori? | SÌ |
| LED-20 | Un `splitKey` sconosciuto produce l'avviso `SPLITKEY_SCONOSCIUTA`? | SÌ |
| LED-21 | Tutti gli importi del ledger sono interi (centesimi)? | SÌ (`Number.isInteger` su ogni campo numerico) |
| LED-22 | `pages admin` non deducono più "acconto incassato" dallo `status` della quote? | SÌ (grep in `AccontiClient`/`EventiCassaClient` sostituiti o eliminati) |

### 7.4 Registro incassi (PAY)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| PAY-01 | Registrare un incasso richiede ≤ 2 click dalla Scheda Evento più la compilazione dell'importo? (SÌ) | UI |
| PAY-02 | Il record salvato contiene tutti i campi del tipo `Payment` con `quote_id` UUID completo (36 caratteri)? (SÌ) | Store |
| PAY-03 | Importo 0, negativo, non numerico o con più di 2 decimali viene rifiutato lato server? (SÌ, 4/4) | Chiamata diretta all'action |
| PAY-04 | Una chiamata all'action con sessione `planner`, `segreteria` o `wedding` viene rifiutata? (SÌ, 3/3) | Test con cookie di ruolo |
| PAY-05 | Non esiste alcuna funzione che rimuove fisicamente un pagamento? (SÌ) | grep `payments.filter`/`splice` in scrittura |
| PAY-06 | L'annullamento richiede un motivo e il pagamento resta visibile barrato? (SÌ) | UI + store |
| PAY-07 | Dopo la registrazione, testata, scheda Cassa, `/admin/cassa` e `/admin` mostrano i valori aggiornati senza ricaricare manualmente la cache? (SÌ) | UI |
| PAY-08 | Un incasso in contanti ≥ € 5.000 mostra un avviso non bloccante? (SÌ) | UI |
| PAY-09 | Un incasso registrato su quote con id inesistente o prefisso ambiguo viene rifiutato? (SÌ) | Action |
| PAY-10 | Due registrazioni concorrenti (es. 20 chiamate parallele) producono esattamente 20 record e nessuna perdita di altri dati (Diario intatto)? (SÌ) | Test di carico locale |

### 7.5 Scheda Regia (EVT)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| EVT-01 | `/admin/eventi/<uuid>` si apre per **ogni** quote presente in `data_store.json` senza errori? (SÌ, 48/48 sull'attuale store) | Script che visita tutte le quote |
| EVT-02 | Un id inesistente restituisce 404? Un prefisso a 8 caratteri restituisce 404 (non un evento qualsiasi)? (SÌ, SÌ) | `curl` |
| EVT-03 | La testata mostra Concordato, Incassato, Residuo, Prossima scadenza ed è visibile su tutte e 5 le schede? (SÌ) | UI |
| EVT-04 | Le schede sono esattamente Panoramica, Servizi, Cassa, Diario Sposi, Ospiti e sono indirizzabili via `?tab=`? (SÌ) | UI + URL |
| EVT-05 | La Panoramica mostra il link al PDF firmato quando `pdf_url` esiste e "Contratto non ancora firmato" altrimenti? (SÌ) | UI con quote `edd86915…` (ha PDF) e una senza |
| EVT-06 | La scheda Servizi distingue con etichette diverse Totale firmato / In attesa di firma / Bozza? (SÌ) | UI |
| EVT-07 | Il Totale firmato mostrato in Servizi è identico al Concordato della testata e a quello dell'Allegato B PDF? (SÌ, al centesimo) | Confronto |
| EVT-08 | La scheda Diario mostra tutte le domande definite in `weddingDiaryFields.ts` (numero letto dal file), anche quelle vuote? (SÌ) | Conteggio DOM vs file |
| EVT-09 | La scheda Ospiti mostra i contatori Adulti, Bambini, Celiaci, Vegani/Vegetariani, Allergie? (SÌ) | UI |
| EVT-10 | Nessun elemento della Scheda è fisso nel quadrante in basso a destra e il `DemoRoleSwitcher` resta cliccabile con il drawer incassi aperto? (SÌ) | UI |
| EVT-11 | `deriveEventStage` restituisce lo stesso stato mostrato in lista Eventi, Oggi e testata Scheda per la stessa quote? (SÌ) | Confronto su 10 quote |

### 7.6 Segregazione ruoli (SEG)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| SEG-01 | La risposta HTML+RSC di `/planner/eventi/<uuid>` non contiene le sottostringhe `prezzo`, `importo`, `totale`, `iban`, `payments`, `pdf_url`, `€`? (SÌ, 0 occorrenze) | `curl` con cookie planner + grep |
| SEG-02 | `/planner/eventi/<uuid>?tab=cassa` non mostra dati economici (404 o scheda assente)? (SÌ) | `curl` |
| SEG-03 | Con sessione planner, `/admin/eventi/<uuid>` reindirizza fuori da `/admin`? (SÌ) | `curl` |
| SEG-04 | La planner vede la scheda Diario e Ospiti con gli stessi contenuti della Direzione? (SÌ) | Confronto |
| SEG-05 | L'area sposi mostra rate e "già versato" ma non lo split tra società né il conguaglio? (SÌ) | UI sposi |
| SEG-06 | Con sessione sposi, cambiare `?id=` nell'URL non mostra l'evento di un altro cliente? (SÌ) | Test manuale |
| SEG-07 | Gli sposi non possono aggiungere o rimuovere servizi (solo firmare Allegati B generati dalla Direzione)? (SÌ) | UI + action |
| SEG-08 | La segreteria (`/segreteria`) continua a non vedere alcun dato finanziario? (SÌ) | grep payload |

### 7.7 Retrocompatibilità e regressioni (RET)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| RET-01 | Il `DemoRoleSwitcher` è invariato (diff vuoto su `src/components/DemoRoleSwitcher.tsx` e sul suo montaggio in `src/app/layout.tsx`)? (SÌ) | `git diff` |
| RET-02 | Il selettore riconosce ancora il ruolo Direzione su tutte le nuove rotte `/admin/**`? (SÌ) | UI |
| RET-03 | I link di firma già inviati (`/contratti/{wedding,eventi}?prezzo=…&preventivo=<8char>&sig=…`) continuano ad aprire il contratto corretto? (SÌ) | Test con un link esistente |
| RET-04 | La firma di un contratto continua a caricare il PDF su R2 e a creare il record in `signed_contracts`? (SÌ) | Test end-to-end |
| RET-05 | `final_contracts` resta separato da `signed_contracts` (regressione S1)? (SÌ) | Codice |
| RET-06 | Nessuna quote, cliente, diario o contratto esistente viene perso dopo la migrazione (conteggi prima = dopo)? (SÌ) | Script conteggi |
| RET-07 | Dopo la migrazione, ogni `signed_contracts[].quote_id` a prefisso univoco è normalizzato a UUID completo, e i casi ambigui sono elencati e non modificati? (SÌ) | Report |
| RET-08 | Ogni diario con `client_id` legato a una sola quote wedding ha ora `quote_id` valorizzato? (SÌ) | Store |
| RET-09 | Gli eventi firmati senza pagamenti mostrano il banner "Incassi storici non registrati" e nessun pagamento è stato creato automaticamente? (SÌ) | Store + UI |
| RET-10 | Il Wedding Diary autosave continua a fondere le risposte senza cancellarle (test: due salvataggi parziali consecutivi)? (SÌ) | Test |
| RET-11 | Il calendario opzioni 7gg mostra le stesse date occupate prima e dopo il refactoring? (SÌ) | Confronto |

### 7.8 Qualità tecnica (TEC)
| ID | Criterio (atteso) | Verifica |
|---|---|---|
| TEC-01 | `npm run build` termina senza errori e `tsc --noEmit` senza errori nei file nuovi? (SÌ) | CLI |
| TEC-02 | `npm run lint` non introduce nuovi errori rispetto a `main`? (SÌ) | CLI |
| TEC-03 | Nei nuovi `page.tsx` dinamici, `params` e `searchParams` sono attesi con `await`? (SÌ) | Codice |
| TEC-04 | Ogni server action che modifica quote/payments/quote_changes/diari chiama `revalidateEvent(id)`? (SÌ) | grep |
| TEC-05 | Nessun nuovo componente usa `toLocaleString` per importi (solo `formatEuro`)? (SÌ) | grep |
| TEC-06 | La scrittura dello store JSON è atomica (file temporaneo + rename)? (SÌ) | Codice |
| TEC-07 | In produzione (`TDA_DATA_SOURCE=supabase`) un errore di scrittura pagamento è mostrato all'utente e non ricade sul JSON? (SÌ) | Test con Supabase non raggiungibile |
| TEC-08 | `CatalogoClient` non usa più `localStorage` come fonte del listino? (SÌ) | grep |
| TEC-09 | `computeEventCashflow` non è più importata da alcuna pagina? (SÌ) | grep |
| TEC-10 | I test unitari dei vettori V1–V5 esistono e passano? (SÌ) | CLI test |

---

## 8. COSA NON FARE (anti-pattern per l'implementazione)

- ❌ Creare nuove voci di menu per nuove funzioni: ogni funzione nuova va in un pilastro o nella Scheda Regia.
- ❌ Ricalcolare importi in un componente React. Solo `computeEventLedger`.
- ❌ Nascondere dati alla Planner lato client.
- ❌ Usare l'email o un prefisso come chiave.
- ❌ Inventare pagamenti storici durante la migrazione.
- ❌ Toccare `DemoRoleSwitcher` o posizionare elementi fissi in basso a destra.
- ❌ Modificare la firma delle funzioni esistenti di `localDb.ts` (aggiungere solo funzioni nuove, come da convenzione già presente nel file).
