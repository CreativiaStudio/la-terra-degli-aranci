import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ecosistema | La Terra degli Aranci",
  description: "Area Clienti e Contratti per La Terra degli Aranci",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        <header style={{ textAlign: 'center', padding: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src="https://www.laterradegliaranci.it/wp-content/uploads/2025/03/TDA_SIMBOLO_2024-03.png" alt="La Terra degli Aranci" style={{ height: '80px', objectFit: 'contain' }} />
          </div>
        </header>
        {children}
        <footer style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} La Terra degli Aranci. Tutti i diritti riservati.<br/>
          P.IVA. 06039150633 - Piazzetta Santo Stefano, 7 - Napoli (Vomero)
        </footer>
      </body>
    </html>
  );
}
