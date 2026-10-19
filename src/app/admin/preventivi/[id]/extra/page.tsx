import { notFound } from "next/navigation";
import { getQuoteForAdmin } from "@/app/preventivi/modifica/actions";
import { getExtraQuoteLocal } from "@/lib/localDb";
import ExtraServicesClient from "./ExtraServicesClient";

export const revalidate = 0;

export default async function ExtraServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteForAdmin(id);
  if (!quote) return notFound();

  const initialExtraQuote = getExtraQuoteLocal(id);

  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <ExtraServicesClient quote={quote} initialExtraQuote={initialExtraQuote} />
    </div>
  );
}
