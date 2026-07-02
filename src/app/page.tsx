import Link from 'next/link';

export default function Home() {
  return (
    <div className="container" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "var(--text-main)" }}>
        Ecosistema Digitale
      </h1>
      <p style={{ fontSize: "1.2rem", color: "var(--text-light)", marginBottom: "3rem", maxWidth: "600px" }}>
        Benvenuto nel portale gestionale de La Terra degli Aranci. Scegli l'area a cui desideri accedere.
      </p>

      <div className="form-grid" style={{ maxWidth: "800px", width: "100%", gap: "2rem" }}>
        
        {/* Card Admin */}
        <Link href="/admin/contratti" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="premium-card" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ background: "#f0fdf4", color: "#166534", padding: "1rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Area Amministrazione</h2>
            <p style={{ color: "var(--text-light)" }}>Archivio dei contratti firmati, esportazione PDF e gestione dati sensibili. (Richiede Password)</p>
          </div>
        </Link>

        {/* Card Generazione Contratti */}
        <div className="premium-card" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ background: "#fef3c7", color: "#92400e", padding: "1rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Moduli Clienti</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "1.5rem" }}>Pagine pubbliche da inviare ai clienti per la firma digitale.</p>
          
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <Link href="/contratti/wedding" className="btn-primary" style={{ flex: 1, padding: "0.8rem", textAlign: "center", fontSize: "0.9rem" }}>
              Wedding
            </Link>
            <Link href="/contratti/eventi" className="btn-primary" style={{ flex: 1, padding: "0.8rem", textAlign: "center", fontSize: "0.9rem", background: "white", color: "var(--primary)", border: "1px solid var(--primary)" }}>
              Eventi
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
