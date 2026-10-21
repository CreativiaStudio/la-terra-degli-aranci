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
      </body>
    </html>
  );
}
