"use client";

import React, { useState } from "react";

interface FAQ {
  q: string;
  a: string;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  image: string;
  faqs: FAQ[];
}

interface VenueGuideProps {
  lang?: "it" | "en";
  onNavigateToConcierge?: () => void;
}

const faqData: Category[] = [
  {
    id: "location",
    title: "La Location & Gli Spazi",
    icon: "🌿",
    image: "https://www.laterradegliaranci.it/wp-content/uploads/2025/03/COPERTINA-1-scaled.jpg",
    faqs: [
      {
        q: "Dove si trova La Terra degli Aranci?",
        a: "A Napoli in Piazzetta Santo Stefano, tra le colline del Vomero e di Posillipo. Immersa nella natura, ma nel cuore della città, circondata da parchi e architetture storiche come il Castello La Corte dei Leoni."
      },
      {
        q: "Qual è la capienza massima per un evento?",
        a: "Fino a circa 200 ospiti. La Sala Bianca è ideale per ricevimenti ampi, mentre la Sala Tufo è perfetta per eventi intimi, momenti musicali o after party."
      },
      {
        q: "Quanto sono grandi gli spazi esterni?",
        a: "Disponiamo di un agrumeto di circa 6.000 mq, con giardini panoramici, boschetti e radure tra alberi di limoni e aranci."
      },
      {
        q: "È possibile organizzare un evento interamente all'aperto?",
        a: "Sì. I nostri giardini permettono di vivere all'aperto l'accoglienza, l'aperitivo, il rito, il pranzo/cena e la festa finale, con continuità garantita in caso di meteo avverso."
      }
    ]
  },
  {
    id: "cerimonie",
    title: "Matrimoni & Cerimonie",
    icon: "💍",
    image: "https://www.laterradegliaranci.it/wp-content/uploads/2024/06/Terra-degli-Aranci-sposi-homepage.jpg",
    faqs: [
      {
        q: "È possibile celebrare il rito civile ufficiale?",
        a: "Il rito civile con valore legale si celebra alla Casa Comunale, e quello cattolico in chiesa. Da noi è possibile celebrare un rito simbolico (o sociale) altamente emozionale nel Giardino delle Promesse."
      },
      {
        q: "È possibile preparare la sposa in villa?",
        a: "Assolutamente sì. Mettiamo a disposizione l'antica Sala del Camino, che include un bagno privato ricavato nell'antica cisterna dell'acqua. Possono partecipare anche testimoni e damigelle."
      },
      {
        q: "Cosa succede in caso di maltempo durante il rito?",
        a: "Il rito simbolico si sposterà all'interno del suggestivo Giardino d'Inverno al coperto della Sala Tufo, mantenendo tutta la sua magia."
      }
    ]
  },
  {
    id: "cucina",
    title: "Cucina & Banqueting",
    icon: "🍽️",
    image: "https://www.laterradegliaranci.it/wp-content/uploads/2024/11/cucina-1.webp",
    faqs: [
      {
        q: "Avete una cucina interna?",
        a: "Sì, disponiamo di un servizio di banqueting interno d'eccellenza. Non siamo un ristorante tradizionale: la nostra cucina si accende esclusivamente per i nostri eventi."
      },
      {
        q: "Gestite intolleranze, celiachia o menù vegani?",
        a: "Con estrema cura. Il servizio viene gestito in modo discreto e personalizzato affinché ogni ospite viva il ricevimento con serenità. La lista va consegnata 10 giorni prima dell'evento."
      },
      {
        q: "È possibile organizzare angoli gastronomici o show cooking?",
        a: "Sì, dal sushi corner all'angolo pizza, brace in giardino, degustazioni di vini/formaggi e il nostro speciale angolo liquori biologici (Arancello, Limoncello)."
      }
    ]
  },
  {
    id: "musica",
    title: "Musica & Festa",
    icon: "🎵",
    image: "https://www.laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg",
    faqs: [
      {
        q: "Fino a che ora è possibile fare musica?",
        a: "La musica in giardino può proseguire fino alla mezzanotte. Per chi desidera ballare più a lungo, è possibile spostare la festa (after party) nella nostra suggestiva Sala Tufo."
      },
      {
        q: "È possibile organizzare un after party?",
        a: "Sì! L'after party si svolge in Sala Tufo, uno spazio raccolto e perfetto per un DJ set, con impianto audio, luci da discoteca e servizio cocktail bar dedicato."
      },
      {
        q: "È possibile prevedere musica in ogni momento?",
        a: "Sì, disponiamo di un impianto di filodiffusione interna ed esterna. L'intrattenimento dal vivo può essere gestito tramite i nostri numerosi partner musicali."
      }
    ]
  },
  {
    id: "logistica",
    title: "Logistica & Sostenibilità",
    icon: "🚗",
    image: "https://www.laterradegliaranci.it/wp-content/uploads/2024/11/filosofia-above.jpg",
    faqs: [
      {
        q: "È disponibile un parcheggio?",
        a: "Sì. Disponiamo di soluzioni interne e di un parcheggio esterno convenzionato proprio di fronte all'ingresso, organizzato in base al numero di auto previste."
      },
      {
        q: "È possibile portare cani durante l'evento?",
        a: "Sì, cani di piccola taglia al guinzaglio, oppure richiedendo un servizio di dog sitting professionale."
      },
      {
        q: "Come affrontate la sostenibilità e lo spreco alimentare?",
        a: "Pratichiamo la 'Sostenibilità Sensoriale'. Prevediamo angoli 'Doggy Bag' e collaboriamo con onlus per evitare sprechi. Su richiesta, compensiamo le emissioni di CO2 dell'evento piantando nuovi alberi."
      }
    ]
  }
];

export default function VenueGuide({ lang = "it", onNavigateToConcierge }: VenueGuideProps) {
  const isEng = lang === "en";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("location");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Filtraggio globale (se c'è una ricerca) o di categoria
  const filteredData = faqData.map(cat => {
    if (searchQuery.trim() === "") {
      return cat;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filteredFaqs = cat.faqs.filter(
      faq => faq.q.toLowerCase().includes(lowerQuery) || faq.a.toLowerCase().includes(lowerQuery)
    );
    return { ...cat, faqs: filteredFaqs };
  }).filter(cat => cat.faqs.length > 0);

  const currentCategoryObj = searchQuery ? filteredData[0] : faqData.find(c => c.id === activeCategory);
  const displayCategory = searchQuery ? undefined : currentCategoryObj;

  const toggleFaq = (idx: string) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de", overflow: "hidden" }}>
      
      {/* Header e Barra di Ricerca */}
      <div style={{ padding: "2rem", background: "#fdfbf7", borderBottom: "1px solid #eee7de", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", color: "#1e1b18", margin: "0 0 0.5rem 0", fontWeight: 700 }}>
            {isEng ? "Venue Guide & Knowledge Base" : "Guida Location & FAQ"}
          </h2>
          <p style={{ color: "#6a6764", margin: 0, fontSize: "1rem" }}>
            {isEng ? "Everything you need to know about La Terra degli Aranci." : "Tutto quello che c'è da sapere per vivere al meglio il tuo evento a La Terra degli Aranci."}
          </p>
        </div>
        
        <div style={{ position: "relative" }}>
          <input 
            type="text" 
            placeholder={isEng ? "Search (e.g. Parking, Vegan, Music...)" : "Cerca (es. Parcheggio, Vegani, Cani...)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", padding: "1.2rem 1.5rem 1.2rem 3rem", borderRadius: "12px", 
              border: "1px solid #e2d7c7", fontSize: "1rem", outline: "none", 
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)" 
            }}
          />
          <span style={{ position: "absolute", left: "1.2rem", top: "1.2rem", fontSize: "1.2rem", color: "#a39f9b" }}>
            🔍
          </span>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "600px" }}>
        
        {/* Sidebar Navigazione Categorie (Nascosta se c'è ricerca) */}
        {!searchQuery && (
          <div style={{ width: "250px", borderRight: "1px solid #eee7de", background: "#fdfbf7", padding: "1.5rem 1rem" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {faqData.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => { setActiveCategory(cat.id); setExpandedFaq(null); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "1rem", borderRadius: "10px", border: "none",
                      background: activeCategory === cat.id ? "#ffffff" : "transparent",
                      color: activeCategory === cat.id ? "#e58c2c" : "#6a6764",
                      fontWeight: activeCategory === cat.id ? 700 : 500,
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: activeCategory === cat.id ? "0 2px 10px rgba(0,0,0,0.03)" : "none",
                      display: "flex", alignItems: "center", gap: "0.5rem"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                    {cat.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contenuto Principale FAQ */}
        <div style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column" }}>
          
          {searchQuery && (
            <div style={{ marginBottom: "2rem", color: "#e58c2c", fontWeight: 600 }}>
              {isEng ? "Search Results" : "Risultati della Ricerca"}
            </div>
          )}

          {!searchQuery && displayCategory && (
            <div style={{ 
              width: "100%", height: "200px", borderRadius: "16px", overflow: "hidden", 
              marginBottom: "2rem", position: "relative" 
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayCategory.image} alt={displayCategory.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "2rem", color: "#fff" }}>
                <h3 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>{displayCategory.icon} {displayCategory.title}</h3>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }}>
            {(searchQuery ? filteredData : [displayCategory!]).map((cat) => (
              <div key={cat.id} style={{ marginBottom: "2rem" }}>
                {searchQuery && <h3 style={{ fontSize: "1.2rem", color: "#1e1b18", marginBottom: "1rem" }}>{cat.icon} {cat.title}</h3>}
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {cat.faqs.map((faq, idx) => {
                    const faqKey = `${cat.id}-${idx}`;
                    const isOpen = expandedFaq === faqKey;
                    return (
                      <div key={faqKey} style={{ border: "1px solid #eee7de", borderRadius: "12px", overflow: "hidden" }}>
                        <button
                          onClick={() => toggleFaq(faqKey)}
                          style={{
                            width: "100%", textAlign: "left", padding: "1.2rem 1.5rem", background: isOpen ? "#fdfbf7" : "#ffffff",
                            border: "none", fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", cursor: "pointer",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                          }}
                        >
                          {faq.q}
                          <span style={{ color: "#e58c2c", fontSize: "1.2rem", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                            ▼
                          </span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: "0 1.5rem 1.5rem 1.5rem", background: "#fdfbf7", color: "#4a4642", fontSize: "1rem", lineHeight: 1.6 }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {searchQuery && filteredData.length === 0 && (
              <div style={{ textAlign: "center", color: "#a39f9b", padding: "3rem" }}>
                {isEng ? "No results found." : "Nessun risultato trovato."}
              </div>
            )}
          </div>

          {/* CTA "Salotto Digitale" per Effetto Lock-In */}
          <div style={{ marginTop: "3rem", padding: "2rem", background: "#1e1b18", borderRadius: "16px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "#e58c2c" }}>
                {isEng ? "Still have questions?" : "Non hai trovato quello che cerchi?"}
              </h4>
              <p style={{ margin: 0, color: "#a39f9b", fontSize: "0.95rem" }}>
                {isEng ? "Ask our team directly in your Digital Concierge. We usually reply in a few minutes." : "Chiedi direttamente a Roberto e al nostro staff. Rispondiamo in pochissimo tempo."}
              </p>
            </div>
            <button 
              onClick={onNavigateToConcierge}
              style={{ background: "#e58c2c", color: "#fff", border: "none", padding: "0.8rem 2rem", borderRadius: "12px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", transition: "transform 0.2s" }}
            >
              🤵‍♂️ {isEng ? "Go to Concierge" : "Vai al Salotto Digitale"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
