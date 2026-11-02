import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of lines) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Mancano le variabili Supabase in .env.local!");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Inizio migrazione dati da localDb verso Supabase...");

  // 1. Raccogliamo tutti i clienti dai backup e dallo store corrente
  const clientMap = new Map();
  const quoteMap = new Map();

  const files = [
    'data_store.backup_20261002.json',
    'data_store.backup.20261021.json',
    'data_store.json'
  ];

  for (const f of files) {
    if (fs.existsSync(f)) {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        for (const c of (data.clients || [])) {
          if (c && c.id) {
            clientMap.set(String(c.id), {
              id: String(c.id),
              nome: String(c.nome || '').trim(),
              cognome: String(c.cognome || '').trim() || null,
              email: String(c.email || '').trim() || null,
              telefono: String(c.telefono || '').trim() || null,
              partner: String(c.partner || c.sposera_nome || '').trim() || null,
              sposera_nome: String(c.sposera_nome || c.partner || '').trim() || null,
              codice_fiscale: String(c.codice_fiscale || '').trim() || null,
              partita_iva: String(c.partita_iva || '').trim() || null,
              ragione_sociale: String(c.ragione_sociale || '').trim() || null,
              sdi: String(c.sdi || '').trim() || null,
              pec: String(c.pec || '').trim() || null,
              tipo_cliente: String(c.tipo_cliente || 'privato'),
              tags: Array.isArray(c.tags) ? c.tags : [],
              lead_source: String(c.lead_source || c.provenienza || 'diretto'),
              provenienza: String(c.provenienza || c.lead_source || 'Diretto'),
              created_at: c.created_at || new Date().toISOString(),
              updated_at: c.updated_at || new Date().toISOString()
            });
          }
        }
        for (const q of (data.quotes || [])) {
          if (q && q.id) {
            quoteMap.set(String(q.id), {
              id: String(q.id),
              client_id: String(q.client_id || ''),
              tipo_evento: String(q.tipo_evento || 'wedding'),
              data_evento: q.data_evento ? String(q.data_evento).slice(0, 10) : null,
              turno: String(q.turno || 'pranzo'),
              tipo_esclusiva: String(q.tipo_esclusiva || 'esclusiva'),
              formula_opzione: String(q.formula_opzione || 'sala_bianca'),
              spazi_riservati: Array.isArray(q.spazi_riservati) ? q.spazi_riservati : [],
              numero_ospiti: Number(q.numero_ospiti) || 100,
              prezzo: Number(q.prezzo || q.totale_calcolato) || 0,
              totale_calcolato: Number(q.totale_calcolato || q.prezzo) || 0,
              importo_caparra: Number(q.importo_caparra) || 0,
              importo_secondo_acconto: Number(q.importo_secondo_acconto) || 0,
              status: String(q.status || 'bozza'),
              data_firma: q.data_firma || null,
              items: Array.isArray(q.items) ? q.items : [],
              created_at: q.created_at || new Date().toISOString(),
              updated_at: q.updated_at || new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn(`Avviso lettura file ${f}:`, err.message);
      }
    }
  }

  const clientsList = Array.from(clientMap.values());
  const quotesList = Array.from(quoteMap.values());

  console.log(`Trovati ${clientsList.length} clienti unici e ${quotesList.length} preventivi unici.`);

  // Inserimento Clienti
  console.log("Upsert clienti in corso...");
  for (const c of clientsList) {
    const { error } = await supabase.from('clients').upsert(c, { onConflict: 'id' });
    if (error) {
      console.error(`Errore cliente ${c.id} (${c.nome} ${c.cognome}):`, error.message);
    } else {
      console.log(`✓ Cliente migrato: ${c.nome} ${c.cognome || ''}`);
    }
  }

  // Inserimento Preventivi (solo se il client_id esiste)
  console.log("Upsert preventivi in corso...");
  for (const q of quotesList) {
    // se il cliente associato non c'è, creiamo un placeholder o skippiamo
    if (!clientMap.has(q.client_id)) {
      console.warn(`Preventivo ${q.id} orfano (client_id: ${q.client_id}), salto.`);
      continue;
    }
    const { error } = await supabase.from('quotes').upsert(q, { onConflict: 'id' });
    if (error) {
      console.error(`Errore preventivo ${q.id}:`, error.message);
    } else {
      console.log(`✓ Preventivo migrato: ${q.id} (€${q.prezzo})`);
    }
  }

  console.log("MIGRAZIONE COMPLETATA AL 100%!");
}

run().catch(console.error);
