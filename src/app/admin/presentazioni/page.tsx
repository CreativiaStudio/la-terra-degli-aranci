import { getPresentationsDynamic, getPresentationAnalytics } from "@/lib/presentazioniCloud";
import PresentazioniAdminClient from "./PresentazioniAdminClient";

export const dynamic = 'force-dynamic';

export default async function AdminPresentazioniPage() {
  const [presentations, analytics] = await Promise.all([
    getPresentationsDynamic(),
    getPresentationAnalytics(),
  ]);

  return (
    <PresentazioniAdminClient
      initialPresentations={presentations}
      initialAnalytics={analytics}
    />
  );
}
