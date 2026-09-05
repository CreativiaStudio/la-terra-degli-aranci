import { getQuotesFast } from "@/lib/dataHelper";
import AccontiClient from "./AccontiClient";

export const revalidate = 0;

export default async function AccontiPage() {
  const quotes = await getQuotesFast();
  return <AccontiClient quotes={quotes} />;
}
