import PreventivoForm from "./PreventivoForm";
import Link from "next/link";

export default function NuovoPreventivoPage() {
  return (
    <div className="container">
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/admin/preventivi" style={{ color: "#666", textDecoration: "none" }}>← Torna ai Preventivi</Link>
        <h1 style={{ margin: "1rem 0 0 0", fontSize: "2.5rem" }}>Componi Preventivo</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>Crea un nuovo preventivo da inviare al cliente. Una volta accettato, potrà essere convertito in contratto con un click.</p>
      </div>

      <PreventivoForm />
    </div>
  );
}
