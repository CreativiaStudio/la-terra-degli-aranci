import { NextRequest, NextResponse } from "next/server";
import { saveWeddingDiaryLocal, getWeddingDiaryLocal } from "@/lib/localDb";

// FAQ Blindate Ufficiali di Roberto Sola (Estratte integralmente da 05_faq_servizi.md)
const ROBERTO_FAQS = [
  {
    topic: "posizione",
    keywords: ["dove", "trova", "indirizzo", "posizione", "come arrivare", "strada", "metro", "vomero", "posillipo", "tangenziale"],
    answer:
      "La Terra degli Aranci si trova a Napoli in Piazzetta Santo Stefano 7, tra le colline del Vomero e di Posillipo. Da fuori città: uscita Tangenziale Vomero via Cilea, percorrere Corso Europa, svoltare a sinistra in Largo Pallotti e nuovamente a sinistra al Castello La Corte dei Leoni. Stazione Metropolitana più vicina: Linea 1 Quattro Giornate."
  },
  {
    topic: "spazi",
    keywords: ["spazi", "agrumeto", "giardino", "mq", "esterni", "aperto", "sale", "sala bianca", "sala tufo", "ambienti"],
    answer:
      "La struttura dispone di uno splendido agrumeto storico di circa 6.000 mq con alberi di aranci e limoni secolari, la Sala Bianca (luminosa, panoramica con cotto chiaro), la suggestiva Sala Tufo ricavata in un'antica cantina con volte a botte in tufo napoletano, il Giardino delle Promesse e il Giardino d'Inverno. È possibile vivere l'evento interamente all'aperto secondo stagione."
  },
  {
    topic: "capienza",
    keywords: ["capienza", "invitati", "persone", "ospiti", "quanti", "massimo"],
    answer:
      "La location può ospitare comodamente ricevimenti fino a circa 200 ospiti. La Sala Bianca è ideale per i ricevimenti ampi, mentre la Sala Tufo è perfetta per momenti più raccolti, dj set ed after party."
  },
  {
    topic: "rito",
    keywords: ["rito", "cerimonia", "civile", "simbolico", "legale", "chiesa", "promesse"],
    answer:
      "A La Terra degli Aranci NON si celebra il rito civile ufficiale con valore legale (che deve tenersi presso la Casa Comunale) né il rito cattolico. Si celebra esclusivamente il rito simbolico (detto anche rito sociale), altamente personalizzabile in testi, musiche e promesse, all'aperto nel Giardino delle Promesse (o nel Giardino d'Inverno al coperto della Sala Tufo in caso di pioggia)."
  },
  {
    topic: "sposa",
    keywords: ["sposa", "preparazione", "sala camino", "bagno", "cisterna", "vestizione", "trucco", "truccatrice"],
    answer:
      "Per il momento intimo della preparazione della sposa mettiamo a disposizione l'antica Sala del Camino nel cuore della masseria. La sala dispone di un bellissimo bagno dedicato alla sposa ricavato nell'antica cisterna dell'acqua della casa colonica. Possono partecipare testimoni, damigelle e truccatrice."
  },
  {
    topic: "cucina",
    keywords: ["cucina", "banqueting", "catering", "ristorante", "chef", "menu", "piatti", "somministrazione"],
    answer:
      "Disponiamo di un servizio di banqueting interno (Iovino Banquetting S.r.l.), con cucina resident e attrezzature d'avanguardia dedicate all'evento. Non siamo un ristorante né un catering veicolato: le pietanze sono preparate espresse sul posto con ingredienti selezionati e filiera corta a Km0."
  },
  {
    topic: "intolleranze",
    keywords: ["celiaci", "celiaco", "glutine", "gluten free", "allergie", "intolleranze", "vegetariani", "vegani", "bambini"],
    answer:
      "Dedichiamo massima cura agli ospiti celiaci (preparazioni certificate senza glutine), vegetariani, vegani o con allergie alimentari specifiche. La lista definitiva degli invitati con esigenze alimentari speciali deve essere consegnata alla direzione tassativamente entro 10 giorni dall'evento. Sono previsti anche menù bimbi dedicati a €50."
  },
  {
    topic: "musica_orari",
    keywords: ["musica", "orario", "orari", "mezzanotte", "limite", "chiusura", "dj", "fino a che ora", "after party"],
    answer:
      "La musica all'aperto nel parco e nei giardini è consentita tassativamente fino alla mezzanotte (ore 24:00). Chi desidera proseguire la festa dopo la mezzanotte può svolgere l'After Party in Sala Tufo, con dj set, service audio-luci e cocktail bar al chiuso senza limiti restrittivi."
  },
  {
    topic: "parcheggio",
    keywords: ["parcheggio", "auto", "posti", "custodito", "macchine", "arrivo"],
    answer:
      "La Terra degli Aranci dispone di soluzioni di parcheggio interne ed esterne convenzionate custodite situate proprio di fronte all'ingresso della tenuta, per una capienza complessiva di oltre 100 posti auto. Gli ospiti possono accostare davanti all'ingresso per far scendere i passeggeri prima di parcheggiare."
  },
  {
    topic: "animali",
    keywords: ["animali", "cane", "cani", "pet", "dog"],
    answer:
      "I cani di piccola taglia sono benvenuti durante gli eventi, purché tenuti al guinzaglio nel rispetto degli altri ospiti e della tenuta. È inoltre possibile richiedere un servizio professionale di dog sitting convenzionato."
  },
  {
    topic: "sostenibilita",
    keywords: ["sostenibilita", "spreco", "doggy bag", "ambiente", "co2", "alberi"],
    answer:
      "Amiamo definire il nostro approccio Sostenibilità Sensoriale: riduzione dello spreco alimentare con angolo doggy bag elegante su richiesta, materie prime biologiche, e possibilità di compensare le emissioni di CO₂ dell'evento con la piantumazione certificata di nuovi alberi."
  },
  {
    topic: "acconti",
    keywords: ["acconto", "acconti", "pagamento", "caparra", "saldo", "prezzo", "quanto costa", "scadenze"],
    answer:
      "La disciplina dei pagamenti TDA prevede 3 momenti ufficiali: 1° acconto fisso di € 1.500 alla firma contrattuale (Santo Stefano S.r.l.) per il blocco irrevocabile della data; 2° acconto forfettario di € 3.000 a 6 mesi prima dell'evento (Iovino Banquetting S.r.l.); Saldo finale a 10-15 giorni prima dell'evento calcolato sul numero definitivo degli ospiti con ripartizione 60/40."
  }
];

// Estrazione tacitamente delle preferenze espresse nella chat per il Wedding Diary
function extractPreferencesFromText(text: string) {
  const lower = text.toLowerCase();
  const detected: {
    palette?: string;
    style?: string;
    dietary_notes?: string;
    music_preferences?: string;
    preferred_spaces?: string[];
  } = {};

  const preferencesLogged: string[] = [];

  // Palette
  if (lower.includes("arancio") || lower.includes("terracotta") || lower.includes("citrus")) {
    detected.palette = "Terracotta & Citrus (Caldi Agrumi)";
    preferencesLogged.push("Palette Agrumi & Terracotta");
  } else if (lower.includes("oro") || lower.includes("avorio") || lower.includes("bianco")) {
    detected.palette = "Avorio Classico & Oro";
    preferencesLogged.push("Palette Avorio & Oro");
  } else if (lower.includes("verde") || lower.includes("botanic") || lower.includes("salvia") || lower.includes("eucalipto")) {
    detected.palette = "Botanic Green & Eucalyptus";
    preferencesLogged.push("Palette Botanic Green");
  } else if (lower.includes("rosa") || lower.includes("cipria") || lower.includes("blush")) {
    detected.palette = "Sunset Blush & Rose";
    preferencesLogged.push("Palette Sunset Rose");
  }

  // Stile
  if (lower.includes("country") || lower.includes("naturale") || lower.includes("provenzale") || lower.includes("botanico")) {
    detected.style = "Country Chic & Naturale";
    preferencesLogged.push("Stile Country Chic & Naturale");
  } else if (lower.includes("elegante") || lower.includes("classico") || lower.includes("formale")) {
    detected.style = "Elegante & Formale Classic";
    preferencesLogged.push("Stile Classico Elegante");
  } else if (lower.includes("minimal") || lower.includes("moderno")) {
    detected.style = "Modern Minimalist & Sophisticated";
    preferencesLogged.push("Stile Modern Minimalist");
  } else if (lower.includes("boho") || lower.includes("vintage") || lower.includes("lucine")) {
    detected.style = "Boho Glam & Lights Garden";
    preferencesLogged.push("Stile Boho Glam");
  }

  // Celiaci / Diete
  if (lower.includes("celiac") || lower.includes("glutine") || lower.includes("vegetari") || lower.includes("vegan") || lower.includes("lattosio") || lower.includes("allerg")) {
    detected.dietary_notes = `Segnalazione cliente via AI Concierge: "${text.slice(0, 140)}"`;
    preferencesLogged.push("Esigenze dietetiche / intolleranze");
  }

  // Musica
  if (lower.includes("jazz") || lower.includes("archi") || lower.includes("violino") || lower.includes("dj") || lower.includes("after party") || lower.includes("musica")) {
    detected.music_preferences = `Preferenza musicale espressa: "${text.slice(0, 140)}"`;
    preferencesLogged.push("Preferenze musicali");
  }

  // Spazi
  const spaces: string[] = [];
  if (lower.includes("agrumeto") || lower.includes("giardino degli aranci")) spaces.push("Giardino degli Aranci (Cocktail & Aperitivi)");
  if (lower.includes("sala bianca")) spaces.push("Sala Bianca (Pranzo/Cena Panoramica)");
  if (lower.includes("sala tufo")) spaces.push("Sala Tufo (After Party & Disco)");
  if (lower.includes("promesse") || lower.includes("rito")) spaces.push("Boschetto Panoramico (Rito Simbolico)");
  if (spaces.length > 0) {
    detected.preferred_spaces = spaces;
    preferencesLogged.push(`Ambienti: ${spaces.join(", ")}`);
  }

  return { detected, preferencesLogged };
}

// Fallback semantico locale basato sulle FAQ di Roberto
function getLocalFallbackAnswer(query: string, clientName: string = "Gentile Ospite"): string {
  const q = query.toLowerCase();

  for (const faq of ROBERTO_FAQS) {
    const hit = faq.keywords.some(k => q.includes(k));
    if (hit) {
      return `${faq.answer}\n\nResto a vostra completa disposizione per ogni ulteriore curiosità sul vostro evento a La Terra degli Aranci! 🍊`;
    }
  }

  return `Grazie per il vostro messaggio, ${clientName}! A La Terra degli Aranci ogni evento è un percorso sartoriale immerso nel verde tra Vomero e Posillipo. Ho annotato i dettagli nel vostro Wedding Diary: il nostro staff ed io siamo pronti ad approfondire ogni vostro desiderio speciale. Per dettagli operativi personalizzati potete sempre concordare un appuntamento in tenuta con Roberto Sola. 🌿🍊`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, clientId = "demo-client", clientName = "Sposi", daysLeft, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Messaggio non valido" }, { status: 400 });
    }

    // 1. Estrazione tacitamente preferenze sposi e aggiornamento Wedding Diary
    const { detected, preferencesLogged } = extractPreferencesFromText(message);
    if (Object.keys(detected).length > 0) {
      try {
        const existing = getWeddingDiaryLocal(clientId) || {};
        saveWeddingDiaryLocal({
          client_id: clientId,
          ...existing,
          ...detected,
          preferred_spaces: detected.preferred_spaces || existing.preferred_spaces,
        });

        // Tenta sync Supabase
        const { getServiceSupabase } = await import("@/lib/supabase");
        const supabase = getServiceSupabase();
        await supabase.from("wedding_diaries").upsert({
          client_id: clientId,
          ...existing,
          ...detected,
          updated_at: new Date().toISOString()
        });
      } catch {
        // Fallback locale già completato con successo
      }
    }

    // 2. Chiamata Gemini Flash via GEMINI_API_KEY se disponibile
    const geminiApiKey = process.env.GEMINI_API_KEY;
    let replyText = "";

    if (geminiApiKey) {
      try {
        const systemPrompt = `Sei l'AI Concierge ufficiale de "La Terra degli Aranci", prestigiosa tenuta per eventi e matrimoni a Napoli (Piazzetta Santo Stefano 7, tra Vomero e Posillipo), diretta dall'Ing. Roberto Sola.
Il tuo tono di voce è caloroso, accogliente, elegante, botanico e rassicurante.
LA TUA KNOWLEDGE BASE È ASSOLUTAMENTE BLINDATA: DEVI ATTENERTI RIGOROSAMENTE AI SEGUENTI FATTI SENZA MAI ALLUCINARE O INVENTARE:
${ROBERTO_FAQS.map(f => `- ${f.topic.toUpperCase()}: ${f.answer}`).join("\n")}

REGOLE TASSATIVE:
1. NON promettere MAI rito civile con valore legale in villa (è solo simbolico).
2. La musica all'aperto termina SEMPRE alle 24:00 (dopo si va in Sala Tufo per l'after party).
3. Parcheggio custodito 100+ auto fronte villa.
4. Bagno sposa nella cisterna colonica della Sala Camino.
5. Minimo garantito 70 pax a 130€/cad (+IVA). 1° acconto 1.500€ alla firma (Santo Stefano), 2° acconto 3.000€ a -6 mesi (Iovino), saldo a 10-15gg.
6. Se la domanda è fuori dal perimetro, rispondi con cortesia ed invita a parlarne con Roberto Sola o la Wedding Planner.
Stai rispondendo a ${clientName}. Rispondi in italiano in modo fluido ed empatico.`;

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const geminiRes = await fetch(geminiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "AntigravityEcosystemBridge/1.0"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nDomanda sposi (${clientName}): ${message}` }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600
            }
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      } catch (geminiErr) {
        console.warn("Gemini API non disponibile o timeout, attivo fallback locale intelligente:", geminiErr);
      }
    }

    // 3. Se Gemini non ha risposto o non è configurato, usa il motore di fallback sulle FAQ di Roberto
    if (!replyText) {
      replyText = getLocalFallbackAnswer(message, clientName);
    }

    return NextResponse.json({
      success: true,
      text: replyText,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      preferencesLogged: preferencesLogged.length > 0 ? preferencesLogged : null
    });
  } catch (error: any) {
    console.error("Errore API ai-concierge:", error);
    return NextResponse.json({ error: error?.message || "Errore interno AI Concierge" }, { status: 500 });
  }
}
