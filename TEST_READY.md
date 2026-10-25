# TEST_READY: Suite di Test Automatizzati — Open Day de La Terra degli Aranci

> **Track**: Dual Track: E2E Testing Track  
> **Data Validazione**: 2026-10-24  
> **Autore**: Test Writer Agent (`test_writer_e2e`)  
> **Stato Collaudo**: ✅ **19/19 TEST SUPERATI (100% SUCCESS RATE)**  
> **Runtime**: Node.js v25.9.0 nativo (`node:test` + `node:assert/strict`)

---

## 1. Come Eseguire i Test

I test sono collocati nella cartella `ecosistema-tda/tests/` e sono eseguibili istantaneamente senza dipendenze esterne pesanti.

### Comando Rapido Universale
Dalla root di `ecosistema-tda`:
```powershell
npm test
```
oppure:
```powershell
node tests/run-all.mjs
```

### Esecuzione di una Singola Suite
```powershell
node --test tests/01_r2_concurrency.test.mjs
node --test tests/02_r2_failover.test.mjs
node --test tests/03_blackbox_audit.test.mjs
node --test tests/04_notifications.test.mjs
node --test tests/05_wedding_diary_hmac.test.mjs
node --test tests/06_qr_scans_stress.test.mjs
```

---

## 2. Esito Ultima Esecuzione (Empirical Proof)

```
===============================================================================
   LA TERRA DEGLI ARANCI — OPEN DAY AUTOMATED TEST SUITE (E2E / DUAL TRACK)    
===============================================================================

Esecuzione di 6 file di test su ambiente Node.js v25.9.0...

▶ Test 1: Concorrenza R2 & Deduplicazione Atomica (Criterio 1)
  ✔ Invocazione concorrente di 20 lead simultanei: 100% registrati senza lost updates o corruzione JSON (382.6ms)
  ✔ Deduplicazione concorrente: 5 richieste parallele con 3 duplicati aggiornano lo stato senza duplicare i record (125.7ms)
  ✔ Adversarial: Nomi con caratteri speciali (apostrofi, ampersand, virgolette, trattini) (30.4ms)
✔ Test 1: Concorrenza R2 & Deduplicazione Atomica (Criterio 1) (539.8ms)

▶ Test 2: Resilienza & Failover R2 Offline su localDb (Criterio 2)
  ✔ Con R2 offline (Network Timeout): submitOpenDayEntryAction salva su localDb, imposta cookie 30gg e ritorna success: true (1131.5ms)
  ✔ Con credenziali R2 non valide (InvalidAccessKeyId): registerOrFindOpenDayLeadCloud preserva i dati su localDb (274.4ms)
✔ Test 2: Resilienza & Failover R2 Offline su localDb (Criterio 2) (1406.8ms)

▶ Test 3: Tracciamento Audit Scatola Nera (Criterio 3)
  ✔ Tracciamento Scansione QR: emette log con categoria LEAD_VISITA e azione QR_CODE_SCANSIONATO (47.5ms)
  ✔ Tracciamento Registrazione e Aggiornamento Lead: LEAD_OPENDAY_REGISTRATO e LEAD_OPENDAY_AGGIORNATO (24.5ms)
  ✔ Tracciamento Wedding Diary: WEDDING_DIARY_AGGIORNATO con categoria DIARIO e percentuale di completamento (18.3ms)
  ✔ Integrità Filtri e Ordinamento Scatola Nera: isolamento categorie e ordine cronologico decrescente (5.9ms)
✔ Test 3: Tracciamento Audit Scatola Nera (Criterio 3) (97.3ms)

▶ Test 4: Notifiche Direzionali Roberto Sola (Criterio 4)
  ✔ Generazione notifiche Open Day (arancione, priorità alta) e Wedding Diary (viola) (92.7ms)
  ✔ Finestra temporale: esclude eventi registrati oltre 7 giorni fa (9.6ms)
  ✔ Ordinamento cronologico decrescente di tutte le notifiche restituite (6.8ms)
✔ Test 4: Notifiche Direzionali Roberto Sola (Criterio 4) (110.3ms)

▶ Test 5: Wedding Diary, Token HMAC & Accesso Collaborativo (Criterio 5)
  ✔ Sicurezza Crittografica HMAC: Generazione e Validazione Timing-Safe del Token di Condivisione (5.5ms)
  ✔ Salvataggio a Patch Collaborativo: Compilazione concorrente Sposo/Sposa senza sovrascritture distruttive (64.5ms)
  ✔ Composizione dei link di condivisione WhatsApp e Accesso Admin 1-Click (2.3ms)
✔ Test 5: Wedding Diary, Token HMAC & Accesso Collaborativo (Criterio 5) (73.1ms)

▶ Test 6: Stress Scansioni QR & Robustezza KPI Conversione (Criterio 6)
  ✔ Stress Scansioni Concorrenti: 30 scansioni rapide registrate e salvate con cronologia (246.3ms)
  ✔ Dual-Write: Scansione registrata sia su R2 che su localDb/openDayTracker (14.4ms)
  ✔ Formula KPI Conversione: Zero crash su divisione per zero e calcolo matematico robusto (35.5ms)
  ✔ Tetto massimo scansHistory: rispetta il limite di 500 elementi per prevenire memory leak (9.7ms)
✔ Test 6: Stress Scansioni QR & Robustezza KPI Conversione (Criterio 6) (306.9ms)

-------------------------------------------------------------------------------
ℹ tests 19
ℹ suites 6
ℹ pass 19
ℹ fail 0
ℹ duration_ms 3972.4
-------------------------------------------------------------------------------
```

---

## 3. Matrice di Copertura per Livelli (Tier 1 - Tier 4)

| Tier | Area | Ambito di Test | File di Test | Esito |
|---|---|---|---|:---:|
| **Tier 1** | **Core Unit & Crittografia** | Validazione token HMAC deterministico (32 hex chars), verifica timing-safe `crypto.timingSafeEqual`, protezione anti-tampering e anti-cross-tenant (`verifyDiaryShareToken`). Normalizzazione telefoni E.164 (`phoneHelper.ts`). Calcolo percentuale di completamento esatto su 24 campi del questionario (`computeDiaryProgress`). | `05_wedding_diary_hmac.test.mjs` | **PASS** |
| **Tier 2** | **Persistenza, Concorrenza & Failover** | 20 scritture simultanee con serializzazione tramite `stateMutex`: 100% lead registrati senza race conditions né lost updates. Integrità JSON su R2 (`openday/cloud_state.json`). Failover su `localDb` con R2 offline o credenziali errate. Impostazione cookie sessione `tda_client_session` a 30 giorni (`maxAge: 2592000`). Riconciliazione automatica bidirezionale (`syncBackLocalLeadsToCloud`). | `01_r2_concurrency.test.mjs`<br>`02_r2_failover.test.mjs` | **PASS** |
| **Tier 3** | **Flussi di Business & Audit** | Scatola Nera (`blackbox.ts`): emissione atomica sincrona e tracciamento eventi `QR_CODE_SCANSIONATO` (categoria `LEAD_VISITA`), `LEAD_OPENDAY_REGISTRATO`/`AGGIORNATO`, `WEDDING_DIARY_AGGIORNATO` (categoria `DIARIO`) con percentuale. Centro Notifiche Direzionali: badge arancione e priorità alta per Open Day, badge viola per Diary, finestra temporale 7 giorni e ordinamento cronologico. Salvataggio collaborativo patch sposo/sposa. | `03_blackbox_audit.test.mjs`<br>`04_notifications.test.mjs`<br>`05_wedding_diary_hmac.test.mjs` | **PASS** |
| **Tier 4** | **Stress, Carico & Robustezza Avversariale** | Stress 30 scansioni rapide concorrenti con cronologia e dual-write su R2 e localDb. Tetto massimo a 500 eventi nella `scansHistory`. Robustezza matematica del conversion rate con divisione per zero (`scans === 0` -> `0%`), arrotondamento e cap al 100%. Sanitizzazione caratteri speciali nei nomi sposi (`"D'Angelo & O'Connor"`, virgolette, ampersand, email maiuscole con spazi). | `01_r2_concurrency.test.mjs`<br>`06_qr_scans_stress.test.mjs` | **PASS** |

---

## 4. Architettura della Suite di Test

```
ecosistema-tda/tests/
├── mocks/
│   ├── next-cache.cjs           # Mock CJS isolato per next/cache (revalidatePath, revalidateTag)
│   └── next-headers.cjs         # Mock CJS isolato per next/headers (cookies jar dinamico)
├── test-helper.mjs              # Harness centrale: JITI loader, S3Client proxy in-memory, backup/restore DB
├── 01_r2_concurrency.test.mjs   # Test Concorrenza R2 (20 richieste simultanee)
├── 02_r2_failover.test.mjs      # Test Failover R2 Offline (localDb + cookie 30gg)
├── 03_blackbox_audit.test.mjs   # Test Scatola Nera Audit Log (LEAD_VISITA, DIARIO)
├── 04_notifications.test.mjs    # Test Centro Notifiche Direzionali Roberto Sola
├── 05_wedding_diary_hmac.test.mjs # Test Wedding Diary HMAC, Patching & Admin Access
├── 06_qr_scans_stress.test.mjs  # Test Stress Scansioni QR & Tasso Conversione
└── run-all.mjs                  # Master test runner con report spec
```

---

## 5. Verifiche di Integrità e Isolamento

1. **Nessun Dato di Produzione Corrotto**: Tutte le operazioni di scrittura R2 vengono intercettate in memoria tramite proxy su `S3Client.prototype.send`. Lo store locale `data_store.json` e `data/blackbox_log.json` vengono salvati e ripristinati automaticamente (`backupLocalDatabases` / `restoreLocalDatabases`).
2. **Nessun Mock di Facciata**: I test invocano le reali Server Actions e le funzioni di dominio (`registerOrFindOpenDayLeadCloud`, `saveWeddingDiaryCloud`, `getAdminNotificationsAction`, `logActivity`, `recordOpenDayScanCloud`), verificando il flusso logico end-to-end.
3. **Resilienza Windows / PowerShell**: Eseguibile con successo nativamente su Windows PowerShell tramite `npm test` con exit code 0.
