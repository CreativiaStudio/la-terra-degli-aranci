import React from "react";
import { getQuotesFast } from "@/lib/dataHelper";
import EventiCassaClient from "./EventiCassaClient";

export const revalidate = 0;

export default async function EventiCassaPage() {
  const quotes = await getQuotesFast();
  return <EventiCassaClient quotes={quotes} />;
}
