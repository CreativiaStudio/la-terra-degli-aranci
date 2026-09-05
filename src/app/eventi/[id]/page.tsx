import React from "react";
import Link from "next/link";
import CheckoutForm from "./CheckoutForm";

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let evento: {
    id: string;
    titolo: string;
    data: string;
    orario: string;
    image: string;
    descrizioneLunga: string;
    menu: string[];
    prezzo: number;
  };

  if (id === "ev-1") {
    evento = {
      id: "ev-1",
      titolo: "Cena Romantica di San Valentino sotto le Stelle",
      data: "14 Febbraio 2027",
      orario: "Dalle 20:30",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
      descrizioneLunga: "Un'esperienza gastronomica irripetibile tra i profumi dell'agrumeto e il calore del Giardino d'Inverno. La serata perfetta per celebrare l'amore.",
      menu: [
        "Amuse-Bouche: Ostrica in tempura, maionese al limone sfusato d'Amalfi",
        "Antipasto: Tartare di tonno rosso, stracciatella e polvere di capperi",
        "Primo: Risotto Carnaroli Riserva, scampi crudi e cotti, sentori di arancia",
        "Secondo: Filetto di fassona, fondo bruno, millefoglie di patate",
        "Dessert: Cuore caldo al cioccolato fondente 70%, cuore di lamponi"
      ],
      prezzo: 95
    };
  } else if (id === "ev-3") {
    evento = {
      id: "ev-3",
      titolo: "Gran Pranzo di Pasqua Tradizionale & Agrumi in Fiore",
      data: "28 Marzo 2027",
      orario: "Dalle 13:00 alle 18:00",
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1600&auto=format&fit=crop",
      descrizioneLunga: "La grande tradizione pasquale napoletana reinterpretata dall'alta cucina di Iovino Banqueting nel parco secolare de La Terra degli Aranci.",
      menu: [
        "Aperitivo di Benvenuto: Spumante campano e casatiello caldo gourmet",
        "Antipasto: Selezione di salumi dei Monti Lattari, ricotta salata e fave fresche dell'orto",
        "Primo della Tradizione: Minestra maritata e ravioli di pasta fresca alla genovese napoletana",
        "Secondo: Cosciotto d'agnello cotto a bassa temperatura con patate novelle agli agrumi",
        "Buffet di Dolci: Pastiera napoletana d'autore al profumo d'arancio biologico e uova artigianali"
      ],
      prezzo: 85
    };
  } else {
    evento = {
      id: "ev-2",
      titolo: "Risveglio di Primavera & Concerto Jazz",
      data: "20 Aprile 2027",
      orario: "Dalle 18:30 alle 23:30",
      image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1600&auto=format&fit=crop",
      descrizioneLunga: "Saluta l'arrivo della primavera con una serata all'insegna della musica jazz dal vivo, cocktail botanici creati con le nostre erbe aromatiche e una selezione di finger food gourmet.",
      menu: [
        "Corner Botanico: Spritz all'arancia amara e rosmarino, Gin Tonic al timo",
        "Corner Salato: Frittini della tradizione partenopea, mini burger gourmet",
        "Corner Rustico: Selezione di salumi campani e formaggi DOP",
        "Primo Espresso: Paccheri di Gragnano con pomodorini gialli e basilico fresco"
      ],
      prezzo: 50
    };
  }

  return (
    <div style={{ background: "#fdfbf7", minHeight: "100vh", fontFamily: "'Outfit', sans-serif" }}>
      {/* Navbar Minimal */}
      <nav style={{ padding: "1.5rem 5%", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee8df", background: "#fff" }}>
        <Link href="/cliente?mode=storico&id=demo4" style={{ textDecoration: "none", color: "#1e1b18", fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🍊</span>
          La Terra degli Aranci
        </Link>
        <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          ⭐ Prevendita Prioritaria 48h Attiva
        </div>
      </nav>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem", display: "flex", flexWrap: "wrap", gap: "4rem" }}>
        {/* Colonna Sinistra (Dettagli Evento) */}
        <div style={{ flex: "1 1 500px" }}>
          <Link href="/cliente?mode=storico&id=demo4" style={{ display: "inline-block", color: "#e58c2c", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, marginBottom: "2rem" }}>
            ← Torna al Salotto Club TDA
          </Link>

          <span style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", fontSize: "0.8rem", fontWeight: 800, padding: "0.3rem 0.8rem", borderRadius: "20px", textTransform: "uppercase", marginBottom: "1rem" }}>
            📅 {evento.data} • {evento.orario}
          </span>

          <h1 style={{ fontSize: "2.3rem", fontFamily: "serif", color: "#1e1b18", margin: "0 0 1rem 0", lineHeight: 1.2 }}>
            {evento.titolo}
          </h1>

          <p style={{ color: "#64748b", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            {evento.descrizioneLunga}
          </p>

          <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid #eee8df", marginBottom: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#1e1b18", fontSize: "1.1rem" }}>
              🍽️ Percorso Gastronomico Previsto
            </h3>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#475569", fontSize: "0.95rem", lineHeight: 1.7 }}>
              {evento.menu.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colonna Destra (Form Acquisto Ticket) */}
        <div style={{ flex: "1 1 420px" }}>
          <div className="premium-card" style={{ padding: "2.5rem", background: "#ffffff", border: "1px solid #fed7aa", borderRadius: "20px" }}>
            <CheckoutForm evento={evento} />
          </div>
        </div>
      </main>
    </div>
  );
}
