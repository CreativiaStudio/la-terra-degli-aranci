"use client";

import React, { useState, useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentBlock {
  id: string;
  type: "paragraph" | "heading" | "image" | "quote" | "faq";
  text?: string;
  items?: string[];
  url?: string;
  alt?: string;
  author?: string;
  faqs?: FAQItem[];
}

interface BlogPost {
  id: string;
  titolo: string;
  slug: string;
  estratto: string;
  blocks: ContentBlock[];
  immagine: string;
  categoria: string;
  stato: "bozza" | "in_revisione" | "pubblicato";
  dataCreazione: string;
  autore: string;
  // Campi Rank Math SEO & AI GEO Optimization
  focusKeyword: string;
  seoTitle: string;
  seoDescription: string;
  rankMathScore: number;
  dataPubblicazione?: string;
  wpPostId?: number;
  wpLink?: string;
}

interface WPMediaItem {
  id: number;
  title: string;
  url: string;
  thumbnail: string;
}

export default function BlogApprovalAdminPage() {
  // BOZZA UFFICIALE WORDPRESS DI MARIO & ROBERTO CON SEO RANK MATH & AI FAQ INTEGRATE
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: "bozza-vegano-ufficiale",
      titolo: "Menù di Matrimonio Vegano: Idee e Tendenze Eco-Chic",
      slug: "menu-matrimonio-vegano-idee-tendenze-eco-chic",
      estratto: "Scegliere un menù di matrimonio vegano non è più solo una semplice alternativa alimentare, ma una vera e propria dichiarazione di stile. Sempre più coppie desiderano che il giorno del loro 'sì' sia un riflesso profondo dei propri valori.",
      immagine: "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg",
      categoria: "I Menù & Gastronomia Gourmet (Bozza WP)",
      stato: "in_revisione",
      dataCreazione: "11 Agosto 2026",
      autore: "Roberto Sola & Redazione TDA",
      // Rank Math SEO Defaults
      focusKeyword: "matrimonio vegano napoli",
      seoTitle: "Menù di Matrimonio Vegano a Napoli | La Terra degli Aranci",
      seoDescription: "Scopri come organizzare un banchetto di nozze 100% vegetale ed eco-chic a La Terra degli Aranci tra le colline del Vomero. Cucina interna e materie prime a Km0.",
      rankMathScore: 92,
      blocks: [
        {
          id: "b1",
          type: "paragraph",
          text: "Scegliere un menù di matrimonio vegano non è più solo una semplice alternativa alimentare, ma una vera e propria dichiarazione di stile. Sempre più coppie desiderano che il giorno del loro 'sì' sia un riflesso profondo dei propri valori: un inno all'amore che abbracci anche il rispetto per la natura e per l'ambiente circostante."
        },
        {
          id: "b2",
          type: "paragraph",
          text: "Organizzare un banchetto di nozze 100% vegetale significa offrire agli ospiti un'esperienza sensoriale innovativa. A <b>La Terra degli Aranci</b> non ci limitiamo a offrire un menù, ma abbracciamo quella che amiamo chiamare <b>Sostenibilità Sensoriale</b>: un modo di vivere l'evento in armonia con la natura, con le persone e con i 6.000 mq di agrumeto che ci circondano tra le colline del Vomero e Posillipo."
        },
        {
          id: "b3",
          type: "heading",
          text: "La Sostenibilità Sensoriale e il Km0"
        },
        {
          id: "b4",
          type: "paragraph",
          text: "La chiave per un menù vegano di successo risiede nella qualità assoluta delle materie prime e nella filiera corta. Potendo contare sulla nostra cucina interna e su una brigata di chef residenti, il nostro lavoro nasce esclusivamente per l'evento, senza i compromessi dei catering esterni. Questo ci permette di selezionare verdure di stagione, erbe aromatiche fresche e prodotti locali selezionati accuratamente (pur non avendo un orto interno, ci affidiamo alle migliori filiere corte del territorio)."
        },
        {
          id: "b5",
          type: "image",
          url: "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg",
          alt: "Banchetto Vegano d'Autore La Terra degli Aranci"
        },
        {
          id: "b6",
          type: "paragraph",
          text: "Dall'aperitivo nel <b>Giardino delle Promesse</b>, con finger food creativi e angoli gastronomici rivisitati (come le classiche montanarine e calzoncini napoletani in chiave 100% plant-based), fino ai primi piatti che reinventano la grande tradizione. E per combattere lo spreco alimentare, offriamo soluzioni eleganti come l'esclusivo <b>angolo Doggy Bag</b>, nel pieno rispetto della sicurezza alimentare."
        },
        {
          id: "b7",
          type: "heading",
          text: "Un'esperienza che unisce tutti gli ospiti"
        },
        {
          id: "b8",
          type: "paragraph",
          text: "Il timore di molti futuri sposi è che un menù privo di derivati animali possa non incontrare i gusti degli ospiti più legati alla tradizione. Come amiamo ripetere sempre alle nostre coppie: <i>non dovete convincere i vostri parenti che il menù vegano sia diverso: dovete far vivere loro un pranzo così buono, ricco e raffinato da far dimenticare ogni pregiudizio</i>."
        },
        {
          id: "b9",
          type: "quote",
          text: "Il nostro menu vegano nasce dal desiderio di trasformare la semplicita della natura in un'esperienza elegante, inclusiva e ricca di emozione.",
          author: "La Terra degli Aranci"
        },
        {
          id: "b10",
          type: "heading",
          text: "La Wedding Cake e il Finale a Impatto Zero"
        },
        {
          id: "b11",
          type: "image",
          url: "https://laterradegliaranci.it/wp-content/uploads/2025/01/c42f8af69b00ef4678797b3b0241ac2e.jpg",
          alt: "Dettaglio Piatto Gourmet della Tradizione Vegana"
        },
        {
          id: "b12",
          type: "paragraph",
          text: "Il gran finale non è da meno. Dopo aver degustato l'autentico Arancello, Limoncello o Mandarinetto prodotti esclusivamente con gli agrumi biologici del nostro parco, si passa alla torta. La torta nuziale vegana unisce alta pasticceria vegetale, estetica scenografica e ritualità emozionale. Le nostre proposte garantiscono un taglio della torta mozzafiato, mantenendo intatto l'impegno etico degli sposi."
        },
        {
          id: "b13",
          type: "paragraph",
          text: "Celebrare il proprio amore rispettando il pianeta è il massimo dell'eleganza. Se sognate un ricevimento che unisca la bellezza di un'oasi verde nel cuore di Napoli a una proposta culinaria eticamente ineccepibile, la nostra direttrice eventi e la wedding planner interna vi aspettano per costruire un progetto su misura."
        },
        {
          id: "b14",
          type: "paragraph",
          text: "<b>Contattateci per visitare La Terra degli Aranci e iniziare a progettare il vostro matrimonio eco-chic.</b>"
        },
        {
          id: "b15-faq",
          type: "faq",
          faqs: [
            {
              question: "È possibile richiedere un menù 100% vegano a La Terra degli Aranci?",
              answer: "Certamente. La Terra degli Aranci dispone di una cucina interna con chef residenti specializzati in alta pasticceria e banquetting vegano ed eco-chic, senza ricorrere a catering esterni."
            },
            {
              question: "Come viene gestita la torta nuziale per un matrimonio vegano?",
              answer: "Realizziamo scenografiche Wedding Cake 100% plant-based nate dalla nostra pasticceria interna, abbinate ai liquori biologici del parco (Arancello e Limoncello TDA)."
            },
            {
              question: "Gli ospiti non vegani apprezzeranno il menù?",
              answer: "Sì, la nostra filosofia di Sostenibilità Sensoriale punta su ricette ricche, ingredienti freschi a Km0 e sapori della tradizione mediterranea rivisitati, capaci di conquistare anche gli invitati più tradizionalisti."
            }
          ]
        }
      ]
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // WP Media Library State
  const [mediaItems, setMediaItems] = useState<WPMediaItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [targetBlockIdForImage, setTargetBlockIdForImage] = useState<string | "copertina" | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");

  // Editable Rank Math & SEO fields
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editFocusKeyword, setEditFocusKeyword] = useState("");
  const [editSeoTitle, setEditSeoTitle] = useState("");
  const [editSeoDescription, setEditSeoDescription] = useState("");
  const [editBlocks, setEditBlocks] = useState<ContentBlock[]>([]);

  // Caricamento dinamico articoli da WordPress REST API / Local Store
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch("/api/admin/wp-posts");
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            setPosts((prev) => {
              const map = new Map<string, BlogPost>();
              prev.forEach((p) => map.set(p.id, p));
              data.posts.forEach((p: any) => {
                map.set(p.id, { ...map.get(p.id), ...p });
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (e) {
        console.warn("Avviso caricamento post WP:", e);
      }
    };
    loadPosts();
  }, []);

  // Fetch WP Media con supporto Paginazione e Ricerca tramite proxy API
  const fetchWPMedia = async (page = 1, search = "") => {
    setIsLoadingMedia(true);
    try {
      let url = `/api/admin/wp-media?page=${page}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const formatted: WPMediaItem[] = (data.media || []).map((m: any) => ({
          id: m.id,
          title: m.title || `Media #${m.id}`,
          url: m.url,
          thumbnail: m.thumbnail || m.url
        }));
        if (page === 1) {
          setMediaItems(formatted);
        } else {
          setMediaItems((prev) => [...prev, ...formatted]);
        }
        setMediaPage(page);
      }
    } catch (e) {
      console.error("Errore fetch WP Media:", e);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Upload foto dal PC su Cloudflare R2 / Server Locale
  const handleFileUpload = async (file: File) => {
    setIsLoadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/wp-media", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const newMedia: WPMediaItem = {
          id: Date.now(),
          title: data.title || file.name,
          url: data.url,
          thumbnail: data.url
        };
        setMediaItems((prev) => [newMedia, ...prev]);
        handleSelectMedia(newMedia);
        setNotice(`📸 Foto "${file.name}" caricata con successo (${data.source === "r2" ? "Cloudflare R2" : "Server"})!`);
      } else {
        alert(`Errore caricamento: ${data.error || "Errore sconosciuto"}`);
      }
    } catch (err: any) {
      console.error("Errore upload file:", err);
      alert(`Errore caricamento: ${err.message}`);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleOpenMediaPicker = (target: string | "copertina") => {
    setTargetBlockIdForImage(target);
    setIsMediaModalOpen(true);
    if (mediaItems.length === 0) {
      fetchWPMedia(1, "");
    }
  };

  const handleSelectMedia = (media: WPMediaItem) => {
    if (targetBlockIdForImage === "copertina") {
      setEditImage(media.url);
      setNotice(`🖼️ Immagine di copertina (Featured Image) impostata!`);
    } else if (targetBlockIdForImage) {
      setEditBlocks(prev => prev.map(b => b.id === targetBlockIdForImage ? { ...b, url: media.url, alt: media.title } : b));
      setNotice(`📷 Foto del blocco aggiornata dalla Media Library!`);
    }
    setIsMediaModalOpen(false);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenPreview = (post: BlogPost) => {
    setSelectedPost(post);
    setEditTitle(post.titolo);
    setEditExcerpt(post.estratto);
    setEditImage(post.immagine);
    setEditFocusKeyword(post.focusKeyword || "matrimonio vegano napoli");
    setEditSeoTitle(post.seoTitle || post.titolo);
    setEditSeoDescription(post.seoDescription || post.estratto);
    setEditBlocks(post.blocks || []);
    setIsEditing(false);
  };

  // Block Manipulation Functions
  const handleAddBlock = (type: "paragraph" | "heading" | "image" | "quote" | "faq", indexInsertAfter: number) => {
    const newBlock: ContentBlock = {
      id: "blk-" + Date.now() + Math.random().toString(36).substring(2, 5),
      type,
      text: type === "heading" ? "Nuovo Titolo di Sezione" : type === "quote" ? "Citazione in evidenza..." : "Scrivi qui il testo del nuovo paragrafo...",
      author: type === "quote" ? "La Terra degli Aranci" : undefined,
      url: type === "image" ? "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg" : undefined,
      faqs: type === "faq" ? [
        { question: "Quali opzioni vegane offre La Terra degli Aranci?", answer: "Offriamo menù 100% plant-based curati dalla pasticceria e dalla cucina interna." }
      ] : undefined
    };

    const nextBlocks = [...editBlocks];
    nextBlocks.splice(indexInsertAfter + 1, 0, newBlock);
    setEditBlocks(nextBlocks);

    if (type === "image") {
      handleOpenMediaPicker(newBlock.id);
    }
  };

  const handleUpdateBlockText = (id: string, text: string) => {
    setEditBlocks(prev => prev.map(b => b.id === id ? { ...b, text } : b));
  };

  const handleFormatTextInBlock = (id: string, tag: "b" | "i") => {
    setEditBlocks(prev => prev.map(b => {
      if (b.id === id && b.text) {
        const text = b.text;
        if (tag === "b") {
          return { ...b, text: text.includes("<b>") ? text.replace(/<\/?b>/g, "") : `<b>${text}</b>` };
        } else {
          return { ...b, text: text.includes("<i>") ? text.replace(/<\/?i>/g, "") : `<i>${text}</i>` };
        }
      }
      return b;
    }));
  };

  const handleDeleteBlock = (id: string) => {
    setEditBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveChanges = () => {
    if (!selectedPost) return;
    setPosts(prev => prev.map(p => {
      if (p.id === selectedPost.id) {
        return {
          ...p,
          titolo: editTitle,
          estratto: editExcerpt,
          immagine: editImage,
          focusKeyword: editFocusKeyword,
          seoTitle: editSeoTitle,
          seoDescription: editSeoDescription,
          blocks: editBlocks
        };
      }
      return p;
    }));
    setSelectedPost({
      ...selectedPost,
      titolo: editTitle,
      estratto: editExcerpt,
      immagine: editImage,
      focusKeyword: editFocusKeyword,
      seoTitle: editSeoTitle,
      seoDescription: editSeoDescription,
      blocks: editBlocks
    });
    setIsEditing(false);
    setNotice("✨ Modifiche ed impostazioni Rank Math SEO salvate nell'Ecosistema!");
    setTimeout(() => setNotice(null), 3000);
  };

  const handleApproveAndPublish = async (postId: string) => {
    const postToPublish = posts.find((p) => p.id === postId);
    if (!postToPublish) return;

    if (!postToPublish.focusKeyword?.trim()) {
      alert("⚠️ Attenzione: Inserisci la Focus Keyword Rank Math prima di pubblicare l'articolo per garantire il posizionamento SEO!");
      return;
    }

    setPublishingId(postId);
    setNotice("🚀 Invio e pubblicazione articolo con Rank Math SEO e FAQ Schema...");

    try {
      const res = await fetch("/api/admin/wp-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: postToPublish.id,
          titolo: postToPublish.titolo,
          slug: postToPublish.slug,
          estratto: postToPublish.estratto,
          immagine: postToPublish.immagine,
          categoria: postToPublish.categoria,
          blocks: postToPublish.blocks,
          focusKeyword: postToPublish.focusKeyword,
          seoTitle: postToPublish.seoTitle,
          seoDescription: postToPublish.seoDescription,
          autore: postToPublish.autore
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const wpPostId = data.wpResult?.id || data.post?.wpPostId;
        const wpLink = data.wpResult?.link || data.post?.wpLink || `https://www.laterradegliaranci.it/${postToPublish.slug}/`;

        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                stato: "pubblicato",
                wpPostId,
                wpLink,
                dataPubblicazione: new Date().toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })
              };
            }
            return p;
          })
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) => (prev ? { ...prev, stato: "pubblicato", wpPostId, wpLink } : null));
        }
        setNotice(`✅ ${data.message || "Articolo approvato e pubblicato con successo!"}`);
      } else {
        alert(`Errore pubblicazione: ${data.error || "Impossibile completare la pubblicazione"}`);
      }
    } catch (err: any) {
      console.error("Errore chiamata wp-posts:", err);
      alert(`Errore di connessione: ${err.message}`);
    } finally {
      setPublishingId(null);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleRevertPost = async (post: BlogPost) => {
    if (!confirm(`Vuoi rimuovere "${post.titolo}" dal sito WordPress e ripristinarlo in stato di approvazione bozza?`)) {
      return;
    }
    setRevertingId(post.id);
    setNotice("↩️ Rimozione da WordPress e ripristino in bozza in corso...");
    try {
      const wpPostIdParam = post.wpPostId ? `&wpPostId=${post.wpPostId}` : "";
      const res = await fetch(`/api/admin/wp-posts?id=${encodeURIComponent(post.id)}${wpPostIdParam}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === post.id) {
              return {
                ...p,
                stato: "in_revisione",
                wpPostId: undefined,
                wpLink: undefined
              };
            }
            return p;
          })
        );
        if (selectedPost?.id === post.id) {
          setSelectedPost((prev) => (prev ? { ...prev, stato: "in_revisione", wpPostId: undefined, wpLink: undefined } : null));
        }
        setNotice("↩️ Articolo ripristinato con successo in Approvazione ed eliminato da WordPress!");
      } else {
        alert(`Errore durante il ripristino: ${data.error || "Impossibile completare l'operazione"}`);
      }
    } catch (err: any) {
      console.error("Errore chiamata DELETE wp-posts:", err);
      alert(`Errore di connessione: ${err.message}`);
    } finally {
      setRevertingId(null);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Sei sicuro di voler eliminare questa bozza? L'azione non è reversibile.")) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      setNotice("🗑️ Bozza eliminata con successo dall'Ecosistema.");
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Top Title Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
            AREA DIREZIONALE • ROBERTO SOLA
          </span>
          <h1 style={{ fontSize: "2.2rem", color: "#1e1b18", margin: "0.2rem 0 0 0", fontFamily: "Georgia, 'Playfair Display', serif" }}>
            📰 Approvazione Blog + Rank Math SEO & AI GEO
          </h1>
          <p style={{ color: "#6a6764", fontSize: "0.95rem", margin: "0.3rem 0 0 0" }}>
            Gestione completa delle Bozze, SEO Rank Math, Immagine in Evidenza e FAQ Schema per Motori di Ricerca ed AI.
          </p>
        </div>

        <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", color: "#c2410c", padding: "0.6rem 1.2rem", borderRadius: "20px", fontSize: "0.88rem", fontWeight: 700 }}>
          <span>🎯 Rank Math SEO Score: 92/100</span>
        </div>
      </div>

      {notice && (
        <div style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "1rem 1.5rem", borderRadius: "12px", marginBottom: "2rem", fontWeight: 600, fontSize: "0.95rem" }}>
          {notice}
        </div>
      )}

      {/* Grid Bozze in Approvazione - Strict 2 Colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.8rem", marginBottom: "3rem" }}>
        {posts.map((p) => {
          const isPub = p.stato === "pubblicato";

          return (
            <div key={p.id} style={{ background: "#ffffff", borderRadius: "24px", border: "1px solid #e8e2d9", overflow: "hidden", boxShadow: "0 12px 35px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                {/* IMMAGINE IN EVIDENZA (FEATURED IMAGE) */}
                <div style={{ height: "220px", backgroundImage: `url('${p.immagine}')`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                    color: "#fff",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.3rem 0.7rem",
                    borderRadius: "12px"
                  }}>
                    🖼️ Immagine in Evidenza
                  </span>

                  <span style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: isPub ? "#166534" : "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    padding: "0.4rem 0.9rem",
                    borderRadius: "20px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}>
                    {isPub ? "✅ Pubblicato su WordPress" : "⏳ In Attesa Approvazione Roberto"}
                  </span>
                </div>

                <div style={{ padding: "1.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#e58c2c", fontWeight: 800 }}>
                      {p.categoria}
                    </span>
                    <span style={{ color: "#aaa" }}>•</span>
                    <span style={{ fontSize: "0.78rem", color: "#78716c" }}>{p.dataCreazione}</span>
                  </div>

                  <h3 style={{ fontSize: "1.3rem", color: "#1e1b18", fontWeight: 700, margin: "0 0 0.8rem 0", lineHeight: 1.3, fontFamily: "Georgia, serif" }}>
                    {p.titolo}
                  </h3>
                  <p style={{ color: "#6a6764", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
                    {p.estratto}
                  </p>
                  
                  {/* Badge Rank Math SEO */}
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", background: "#faf8f5", padding: "0.6rem 0.9rem", borderRadius: "12px", border: "1px solid #eee7de" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#166534" }}>🎯 Rank Math Score: {p.rankMathScore}/100</span>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>• KW: <strong>{p.focusKeyword}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "1.3rem 1.8rem", background: "#faf8f5", borderTop: "1px solid #e8e2d9", display: "flex", gap: "0.8rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(p)}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #ded7cd",
                      padding: "0.65rem 1.1rem",
                      borderRadius: "12px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#1e1b18",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    👁️ Leggi & Modifica
                  </button>

                  <button
                    type="button"
                    title="Elimina Bozza"
                    onClick={() => handleDeletePost(p.id)}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      padding: "0.65rem 0.9rem",
                      borderRadius: "12px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🗑️ Elimina
                  </button>
                </div>

                {!isPub ? (
                  <button
                    type="button"
                    disabled={publishingId === p.id}
                    onClick={() => handleApproveAndPublish(p.id)}
                    style={{
                      background: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
                      border: "none",
                      color: "#ffffff",
                      padding: "0.65rem 1.2rem",
                      borderRadius: "12px",
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      cursor: publishingId === p.id ? "not-allowed" : "pointer",
                      boxShadow: "0 6px 16px rgba(22,101,52,0.25)"
                    }}
                  >
                    {publishingId === p.id ? "Pubblicazione..." : "🚀 Approva & Pubblica"}
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                    <a
                      href={p.wpLink || `https://www.laterradegliaranci.it/${p.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "0.82rem",
                        color: "#166534",
                        textDecoration: "none",
                        fontWeight: 700,
                        background: "#f0fdf4",
                        padding: "0.45rem 0.8rem",
                        borderRadius: "10px",
                        border: "1px solid #bbf7d0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}
                    >
                      🔗 Live WP
                    </a>
                    <button
                      type="button"
                      disabled={revertingId === p.id}
                      onClick={() => handleRevertPost(p)}
                      style={{
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#c2410c",
                        padding: "0.45rem 0.8rem",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: revertingId === p.id ? "not-allowed" : "pointer"
                      }}
                    >
                      {revertingId === p.id ? "Ripristino..." : "↩️ Ripristina Bozza"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {/* Card 2: Prepara Nuova Bozza */}
        <div style={{ background: "#faf8f5", borderRadius: "24px", border: "2px dashed #ded7cd", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2.5rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s ease" }}
          onClick={() => {
            const newDraft: BlogPost = {
              id: "bozza-" + Date.now(),
              titolo: "Nuovo Articolo Blog in Preparazione",
              slug: "nuovo-articolo-blog",
              estratto: "Fornisci il testo base o lascia generare l'articolo alla redazione prima dell'approvazione finale.",
              immagine: "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg",
              categoria: "In Lavorazione",
              stato: "in_revisione",
              dataCreazione: "Oggi",
              autore: "Redazione TDA",
              focusKeyword: "matrimonio napoli",
              seoTitle: "Nuovo Articolo | La Terra degli Aranci",
              seoDescription: "Descrizione SEO dell'articolo...",
              rankMathScore: 85,
              blocks: [
                { id: "b-new-1", type: "paragraph", text: "Scrivi qui il contenuto del nuovo articolo in bozza per Roberto Sola..." }
              ]
            };
            setPosts(prev => [...prev, newDraft]);
            handleOpenPreview(newDraft);
          }}
        >
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fff7ed", border: "1px solid #ffedd5", color: "#e58c2c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", marginBottom: "1rem" }}>
            ➕
          </div>
          <h3 style={{ fontSize: "1.2rem", color: "#1e1b18", fontWeight: 700, margin: "0 0 0.5rem 0", fontFamily: "Georgia, serif" }}>
            Prepara Nuova Bozza per Roberto
          </h3>
          <p style={{ color: "#78716c", fontSize: "0.88rem", margin: 0, maxWidth: "280px" }}>
            Crea una nuova scheda bozza da revisionare ed approvare prima della pubblicazione su WordPress.
          </p>
        </div>

      </div>

      {/* MODALE ANTEPRIMA & EDITOR CON LAYOUT GRAFICO IDENTICO A WORDPRESS TDA */}
      {selectedPost && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(30,27,24,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1.5rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "28px", maxWidth: "900px", width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "2.8rem", boxShadow: "0 30px 70px rgba(0,0,0,0.3)", position: "relative" }}>
            
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "#f0ede8", border: "none", borderRadius: "50%", width: "38px", height: "38px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}
            >
              ✕
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#e58c2c", fontWeight: 800 }}>
                {selectedPost.categoria}
              </span>
              <span style={{ fontSize: "0.75rem", background: selectedPost.stato === "pubblicato" ? "#f0fdf4" : "#fff7ed", color: selectedPost.stato === "pubblicato" ? "#166534" : "#c2410c", padding: "0.25rem 0.7rem", borderRadius: "12px", fontWeight: 700 }}>
                {selectedPost.stato === "pubblicato" ? "Pubblicato su WordPress" : "Bozza / In Revisione Roberto"}
              </span>
            </div>

            {!isEditing ? (
              /* ANTEPRIMA FEDELE AL 100% AL TEMA DI WORDPRESS LATERRADEGLIARANCI.IT */
              <article style={{ fontFamily: "'Outfit', sans-serif" }}>
                
                {/* Header Titolo Stile WP */}
                <h1 style={{ fontSize: "2.3rem", color: "#1e1b18", fontFamily: "Georgia, 'Playfair Display', serif", lineHeight: 1.25, margin: "0 0 1.2rem 0", fontWeight: 700 }}>
                  {selectedPost.titolo}
                </h1>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "#78716c", fontSize: "0.88rem", marginBottom: "2rem" }}>
                  <span>✍️ {selectedPost.autore}</span>
                  <span>•</span>
                  <span>📅 {selectedPost.dataCreazione}</span>
                </div>

                {/* IMMAGINE IN EVIDENZA (FEATURED IMAGE) HERO */}
                <div style={{ position: "relative", height: "380px", backgroundImage: `url('${selectedPost.immagine}')`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "20px", marginBottom: "2.2rem", boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}>
                  <div style={{ position: "absolute", bottom: "1rem", left: "1rem", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", color: "#fff", padding: "0.4rem 0.9rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
                    🖼️ Immagine in Evidenza (Featured Image WP)
                  </div>
                </div>

                {/* Estratto / Intro Cita Stile WP */}
                <div style={{ background: "#fcf6ed", borderLeft: "4px solid #e58c2c", padding: "1.2rem 1.6rem", borderRadius: "12px", marginBottom: "2.5rem", fontSize: "1.08rem", color: "#3c3834", fontStyle: "italic", lineHeight: 1.6 }}>
                  {selectedPost.estratto}
                </div>

                {/* RENDER VISIVO BLOCCHI CONTENUTO */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "3rem" }}>
                  {editBlocks.map((b) => {
                    if (b.type === "heading") {
                      return (
                        <h3 key={b.id} style={{ fontSize: "1.5rem", color: "#1e1b18", margin: "1.5rem 0 0.4rem 0", fontFamily: "Georgia, 'Playfair Display', serif", fontWeight: 700, borderLeft: "3px solid #e58c2c", paddingLeft: "1rem" }}>
                          {b.text}
                        </h3>
                      );
                    }
                    if (b.type === "image") {
                      return (
                        <div key={b.id} style={{ margin: "1.2rem 0" }}>
                          <img src={b.url} alt={b.alt || "Foto Articolo TDA"} style={{ width: "100%", maxHeight: "420px", objectFit: "cover", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }} />
                          {b.alt && <span style={{ fontSize: "0.82rem", color: "#78716c", textAlign: "center", display: "block", marginTop: "0.5rem", fontStyle: "italic" }}>{b.alt}</span>}
                        </div>
                      );
                    }
                    if (b.type === "quote") {
                      return (
                        <div key={b.id} style={{ background: "#faf8f5", borderLeft: "4px solid #166534", padding: "1.5rem 1.8rem", borderRadius: "16px", margin: "1.2rem 0", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                          <p style={{ fontSize: "1.15rem", color: "#14532d", fontStyle: "italic", margin: "0 0 0.5rem 0", lineHeight: 1.6, fontFamily: "Georgia, serif" }}>
                            {b.text}
                          </p>
                          {b.author && <span style={{ fontSize: "0.85rem", color: "#e58c2c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>- {b.author}</span>}
                        </div>
                      );
                    }
                    if (b.type === "faq" && b.faqs) {
                      return (
                        <div key={b.id} style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "20px", padding: "1.8rem", margin: "2rem 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                            <span style={{ fontSize: "1.2rem" }}>🤖</span>
                            <h4 style={{ fontSize: "1.2rem", color: "#166534", margin: 0, fontFamily: "Georgia, serif" }}>
                              Domande Frequenti (FAQ Schema per Motori di Ricerca & AI)
                            </h4>
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {b.faqs.map((faq, fIdx) => (
                              <div key={fIdx} style={{ background: "#ffffff", padding: "1rem 1.2rem", borderRadius: "12px", border: "1px solid #dcfce7" }}>
                                <strong style={{ color: "#14532d", display: "block", marginBottom: "0.3rem", fontSize: "0.98rem" }}>
                                  ❓ {faq.question}
                                </strong>
                                <p style={{ color: "#374151", margin: 0, fontSize: "0.92rem", lineHeight: 1.6 }}>
                                  {faq.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p key={b.id} style={{ fontSize: "1.08rem", lineHeight: 1.8, color: "#2c2a27", margin: 0 }} dangerouslySetInnerHTML={{ __html: b.text || "" }} />
                    );
                  })}
                </div>

                {/* SCHEDA SEO RANK MATH IN ANTEPRIMA */}
                <div style={{ background: "#faf8f5", border: "1px solid #eee7de", borderRadius: "20px", padding: "1.5rem", marginBottom: "2.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#e58c2c" }}>
                      🔍 ANTEPRIMA SNIPPET RANK MATH SEO (GOOGLE)
                    </span>
                    <span style={{ background: "#f0fdf4", color: "#166534", padding: "0.3rem 0.8rem", borderRadius: "12px", fontWeight: 800, fontSize: "0.82rem" }}>
                      Punteggio SEO: {selectedPost.rankMathScore || 92}/100
                    </span>
                  </div>

                  <div style={{ background: "#ffffff", padding: "1.2rem", borderRadius: "14px", border: "1px solid #ded7cd", fontFamily: "Arial, sans-serif" }}>
                    <span style={{ fontSize: "0.85rem", color: "#202124", display: "block", marginBottom: "0.2rem" }}>https://www.laterradegliaranci.it › blog › {selectedPost.slug}</span>
                    <h4 style={{ color: "#1a0dab", fontSize: "1.15rem", margin: "0 0 0.3rem 0", fontWeight: 400, cursor: "pointer" }}>
                      {editSeoTitle || selectedPost.titolo}
                    </h4>
                    <p style={{ color: "#4d5156", fontSize: "0.88rem", margin: 0, lineHeight: 1.4 }}>
                      {editSeoDescription || selectedPost.estratto}
                    </p>
                  </div>
                </div>

                {/* Footer Tasti Azione */}
                <div style={{ display: "flex", gap: "1.2rem", borderTop: "1px solid #eee7de", paddingTop: "1.8rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{ background: "#e58c2c", color: "#ffffff", border: "none", padding: "0.9rem 2rem", borderRadius: "14px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(229,140,44,0.3)" }}
                  >
                    ✏️ Modifica Testo, Rank Math SEO & FAQ
                  </button>

                  {selectedPost.stato !== "pubblicato" ? (
                    <button
                      type="button"
                      disabled={publishingId === selectedPost.id}
                      onClick={() => handleApproveAndPublish(selectedPost.id)}
                      style={{ background: "linear-gradient(135deg, #166534 0%, #14532d 100%)", color: "#ffffff", border: "none", padding: "0.9rem 2.2rem", borderRadius: "14px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(22,101,52,0.3)" }}
                    >
                      {publishingId === selectedPost.id ? "Pubblicazione in corso..." : "🚀 Approva & Pubblica Ora su WordPress"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "0.9rem", alignItems: "center", flexWrap: "wrap" }}>
                      <a
                        href={selectedPost.wpLink || `https://www.laterradegliaranci.it/${selectedPost.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
                          color: "#ffffff",
                          textDecoration: "none",
                          padding: "0.9rem 1.8rem",
                          borderRadius: "14px",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          boxShadow: "0 6px 18px rgba(22,101,52,0.25)"
                        }}
                      >
                        🔗 Vedi Articolo sul Sito Live
                      </a>
                      <button
                        type="button"
                        disabled={revertingId === selectedPost.id}
                        onClick={() => handleRevertPost(selectedPost)}
                        style={{
                          background: "#fff7ed",
                          color: "#c2410c",
                          border: "1.5px solid #fed7aa",
                          padding: "0.9rem 1.6rem",
                          borderRadius: "14px",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          cursor: revertingId === selectedPost.id ? "not-allowed" : "pointer"
                        }}
                      >
                        {revertingId === selectedPost.id ? "Ripristino in corso..." : "↩️ Rimuovi da WordPress e Torna in Bozza"}
                      </button>
                    </div>
                  )}
                </div>

              </article>
            ) : (
              /* EDITOR VISIVO A BLOCCHI + PANNELLO RANK MATH SEO & FAQ AI */
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee7de", paddingBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#e58c2c", fontWeight: 800 }}>
                      EDITOR VISIVO & RANK MATH SEO
                    </span>
                    <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.3rem", color: "#1e1b18" }}>
                      ✏️ Modifica Contenuti e Parametri SEO
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    style={{ background: "#166534", color: "#fff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
                  >
                    💾 Salva Modifiche & SEO
                  </button>
                </div>

                {/* PANNELLO RANK MATH SEO & KEYWORD FOCUS */}
                <div style={{ background: "#f0fdf4", padding: "1.5rem", borderRadius: "20px", border: "1.5px solid #bbf7d0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#166534" }}>
                      🔍 IMPOSTAZIONI RANK MATH SEO (WORDPRESS)
                    </span>
                    <span style={{ background: "#166534", color: "#fff", padding: "0.2rem 0.7rem", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>
                      Score: 92/100
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#14532d", display: "block", marginBottom: "0.3rem" }}>Focus Keyword (Rank Math)</label>
                      <input
                        type="text"
                        value={editFocusKeyword}
                        onChange={(e) => setEditFocusKeyword(e.target.value)}
                        placeholder="es. matrimonio vegano napoli"
                        style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.9rem", fontWeight: 600 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#14532d", display: "block", marginBottom: "0.3rem" }}>SEO Title per Google & Rank Math</label>
                      <input
                        type="text"
                        value={editSeoTitle}
                        onChange={(e) => setEditSeoTitle(e.target.value)}
                        style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#14532d", display: "block", marginBottom: "0.3rem" }}>Meta Description (Google & Social Snippet)</label>
                    <textarea
                      rows={2}
                      value={editSeoDescription}
                      onChange={(e) => setEditSeoDescription(e.target.value)}
                      style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>

                {/* IMMAGINE IN EVIDENZA (FEATURED IMAGE) */}
                <div style={{ background: "#faf8f5", padding: "1rem 1.2rem", borderRadius: "16px", border: "1px solid #eee7de", display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: "120px", height: "75px", backgroundImage: `url('${editImage}')`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "10px", border: "1px solid #ddd" }}></div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#444", display: "block", marginBottom: "0.2rem" }}>Immagine in Evidenza (Featured Image su WP)</span>
                    <small style={{ color: "#777", display: "block", marginBottom: "0.5rem" }}>È l'immagine principale visualizzata su Google, Social e in cima all'articolo.</small>
                    <button
                      type="button"
                      onClick={() => handleOpenMediaPicker("copertina")}
                      style={{ background: "#e58c2c", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      🖼️ Cambia Immagine in Evidenza da WP Media
                    </button>
                  </div>
                </div>

                {/* LISTA BLOCCHI INTERATTIVI VISIVI */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#777" }}>
                    BLOCCHI CONTENUTO ({editBlocks.length} Blocchi)
                  </span>

                  {editBlocks.map((block, idx) => (
                    <div key={block.id} style={{ background: "#ffffff", border: "1.5px solid #ded7cd", borderRadius: "16px", padding: "1.2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", position: "relative" }}>
                      
                      {/* Controls Bar Blocco */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", borderBottom: "1px solid #f0ede8", paddingBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: block.type === "heading" ? "#e58c2c" : block.type === "image" ? "#166534" : block.type === "quote" ? "#0284c7" : block.type === "faq" ? "#15803d" : "#4b5563" }}>
                          {block.type === "heading" ? "📌 Titolo Sezione (H3)" : block.type === "image" ? "🖼️ Blocco Foto" : block.type === "quote" ? "💬 Citazione in Evidenza" : block.type === "faq" ? "❓ FAQ Schema per AI" : "📝 Paragrafo"}
                        </span>

                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          {block.type !== "image" && block.type !== "faq" && (
                            <>
                              <button
                                type="button"
                                title="Metti in Grassetto"
                                onClick={() => handleFormatTextInBlock(block.id, "b")}
                                style={{ background: block.text?.includes("<b>") ? "#e58c2c" : "#f0ede8", color: block.text?.includes("<b>") ? "#fff" : "#1e1b18", border: "none", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                B
                              </button>
                              <button
                                type="button"
                                title="Metti in Corsivo"
                                onClick={() => handleFormatTextInBlock(block.id, "i")}
                                style={{ background: block.text?.includes("<i>") ? "#e58c2c" : "#f0ede8", color: block.text?.includes("<i>") ? "#fff" : "#1e1b18", border: "none", padding: "0.25rem 0.6rem", borderRadius: "6px", fontStyle: "italic", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                I
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            🗑️ Elimina Blocco
                          </button>
                        </div>
                      </div>

                      {/* Render Editor per Tipo Blocco */}
                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.text || ""}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #ded7cd", fontSize: "1.1rem", fontWeight: 700, color: "#1e1b18" }}
                        />
                      )}

                      {block.type === "paragraph" && (
                        <textarea
                          rows={4}
                          value={block.text || ""}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #ded7cd", fontSize: "0.95rem", lineHeight: 1.6, fontFamily: "inherit" }}
                        />
                      )}

                      {block.type === "quote" && (
                        <textarea
                          rows={3}
                          value={block.text || ""}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #ded7cd", fontSize: "0.95rem", lineHeight: 1.6, fontStyle: "italic", background: "#f0fdf4" }}
                        />
                      )}

                      {block.type === "faq" && block.faqs && (
                        <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#166534", display: "block", marginBottom: "0.8rem" }}>
                            ❓ FAQ Modificabili (Formattate automaticamente in Schema JSON-LD per AI & Google)
                          </span>
                          
                          {block.faqs.map((faq, fIdx) => (
                            <div key={fIdx} style={{ marginBottom: "1rem", background: "#ffffff", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ded7cd" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#444" }}>Domanda #{fIdx + 1}</label>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => {
                                  const updatedFaqs = [...(block.faqs || [])];
                                  updatedFaqs[fIdx].question = e.target.value;
                                  setEditBlocks(prev => prev.map(b => b.id === block.id ? { ...b, faqs: updatedFaqs } : b));
                                }}
                                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.4rem" }}
                              />
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#444" }}>Risposta #{fIdx + 1}</label>
                              <textarea
                                rows={2}
                                value={faq.answer}
                                onChange={(e) => {
                                  const updatedFaqs = [...(block.faqs || [])];
                                  updatedFaqs[fIdx].answer = e.target.value;
                                  setEditBlocks(prev => prev.map(b => b.id === block.id ? { ...b, faqs: updatedFaqs } : b));
                                }}
                                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem" }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {block.type === "image" && (
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <img src={block.url} alt={block.alt || "Foto"} style={{ width: "140px", height: "90px", objectFit: "cover", borderRadius: "10px", border: "1px solid #eee" }} />
                          <div>
                            <span style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
                              {block.alt || "Foto reale dell'articolo WP"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenMediaPicker(block.id)}
                              style={{ background: "#fff7ed", border: "1px solid #ffedd5", color: "#c2410c", padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              🖼️ Sostituisci Foto da WP Media
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tasti Inserimento Rapido sotto il blocco */}
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleAddBlock("paragraph", idx)}
                          style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#475569", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          ➕ Paragrafo Qui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock("heading", idx)}
                          style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#475569", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          📌 Titolo Qui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock("quote", idx)}
                          style={{ background: "#f0f9ff", border: "1px dashed #bae6fd", color: "#0284c7", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          💬 Citazione Qui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock("faq", idx)}
                          style={{ background: "#f0fdf4", border: "1px dashed #bbf7d0", color: "#166534", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          ❓ Blocco FAQ Schema per AI
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock("image", idx)}
                          style={{ background: "#f0fdf4", border: "1px dashed #bbf7d0", color: "#166534", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          📷 Foto tra i Blocchi Qui
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    style={{ background: "#e58c2c", color: "#fff", border: "none", padding: "0.8rem 2rem", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    💾 Salva Modifiche & SEO
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{ background: "#f0ede8", color: "#666", border: "none", padding: "0.8rem 1.5rem", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Annulla ed Esci
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* MODALE MEDIA LIBRARY WORDPRESS REALTIME */}
      {isMediaModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "900px", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "2rem", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", position: "relative" }}>
            
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(false)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "#f0ede8", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                  WORDPRESS MEDIA INTEGRATION
                </span>
                <h2 style={{ fontSize: "1.5rem", color: "#1e1b18", margin: "0.2rem 0 0 0", fontFamily: "Georgia, serif" }}>
                  🖼️ Media Library Ufficiale La Terra degli Aranci
                </h2>
                <p style={{ color: "#666", fontSize: "0.88rem", margin: "0.3rem 0 0 0" }}>
                  Scegli l'Immagine in Evidenza (Featured Image) o le foto intermedie dalla libreria o dal PC.
                </p>
              </div>

              {/* Tasto Carica dal PC */}
              <label style={{
                background: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
                color: "#ffffff",
                padding: "0.6rem 1.2rem",
                borderRadius: "12px",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(22,101,52,0.2)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                📤 Carica Foto dal PC su WP
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Search Bar & Stats */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.2rem" }}>
              <input
                type="text"
                placeholder="🔍 Cerca foto per nome nella libreria (es. confettata, sala, agrumeto)..."
                value={mediaSearchQuery}
                onChange={(e) => {
                  setMediaSearchQuery(e.target.value);
                  fetchWPMedia(1, e.target.value);
                }}
                style={{ flex: 1, padding: "0.7rem 1rem", borderRadius: "12px", border: "1px solid #ded7cd", fontSize: "0.92rem" }}
              />
            </div>

            {isLoadingMedia && mediaItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 0", color: "#e58c2c", fontWeight: 700 }}>
                Caricamento Media Library da WordPress in corso... ⌛
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  {mediaItems.map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMedia(m)}
                      style={{
                        border: "1px solid #eee7de",
                        borderRadius: "14px",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: "#faf8f5"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <div style={{ height: "130px", backgroundImage: `url('${m.thumbnail}')`, backgroundSize: "cover", backgroundPosition: "center" }}></div>
                      <div style={{ padding: "0.6rem", fontSize: "0.75rem", color: "#444", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.title}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    disabled={isLoadingMedia}
                    onClick={() => fetchWPMedia(mediaPage + 1, mediaSearchQuery)}
                    style={{ background: "#faf8f5", border: "1px solid #ded7cd", color: "#1e1b18", padding: "0.7rem 1.8rem", borderRadius: "12px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    {isLoadingMedia ? "Caricamento..." : `🔄 Carica Altre 100 Foto (Pagina ${mediaPage + 1})`}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
