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
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <footer style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-light)', fontSize: '0.9rem', background: '#ffffff', borderTop: '1px solid #eae2d6' }}>
          &copy; {new Date().getFullYear()} La Terra degli Aranci. Tutti i diritti riservati.<br/>
          P.IVA. 06039150633 - Piazzetta Santo Stefano, 7 - Napoli (Vomero)
        </footer>
      </body>
    </html>
  );
}
