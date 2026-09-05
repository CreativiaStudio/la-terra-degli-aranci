/**
 * Fiscal Calculator Engine for La Terra degli Aranci (Ecosistema TDA)
 */

import { calculateServiceSplit, ServiceSplitResult } from "./servicesCatalog";

export { calculateServiceSplit };
export type { ServiceSplitResult };

export const SANTO_STEFANO_CORP = {
  ragioneSociale: "Santo Stefano S.r.l.",
  piva: "06039150633",
  vatRate: 0.22,
  vatPercent: 22,
  legalRep: "Ing. Roberto Sola",
  role: "Location, Villa Lease and Fixed Quotas",
  banca: "Intesa Sanpaolo - Filiale Napoli Vomero",
  iban: "IT60X0306909606100000012345"
} as const;

export const IOVINO_CORP = {
  ragioneSociale: "Iovino Banquetting S.r.l. soc. unipersonale",
  piva: "06818681212",
  vatRate: 0.10,
  vatPercent: 10,
  legalRep: "Sig.ra Rosaria Iovino",
  role: "Catering, Somministrazione and Beverage",
  banca: "Banca Monte dei Paschi di Siena",
  iban: "IT40Y0103003200000000678901"
} as const;

export const COMPANY_INFO = {
  SANTO_STEFANO: SANTO_STEFANO_CORP,
  IOVINO: IOVINO_CORP
} as const;

export interface VillaMarginResult {
  prezzo: number;
  costoFornitore: number;
  margineNetto: number;
  percentualeMargine: number;
}

export function calculateVillaMargin(prezzo: number, costoFornitore: number = 0): VillaMarginResult {
  const margin = Math.max(0, prezzo - (costoFornitore || 0));
  const perc = prezzo > 0 ? Math.round((margin / prezzo) * 100) : 0;
  return {
    prezzo,
    costoFornitore: costoFornitore || 0,
    margineNetto: margin,
    percentualeMargine: perc
  };
}

export interface SimulationExtraItem {
  id: string;
  code?: string;
  nome: string;
  prezzo_unitario: number;
  quantita: number;
  splitKey?: string;
  splitLabel?: string;
}

export interface WeddingSimulationInput {
  adultsCount: number;
  childrenCount: number;
  menuType: 'base' | 'mandarancio' | 'arancio';
  isSaturday?: boolean;
  extras: SimulationExtraItem[];
}

export interface WeddingSimulationResult {
  adultsCount: number;
  adultPriceUnit: number;
  adultsTotal: number;
  childrenCount: number;
  childrenTotal: number;
  receptionTotal: number;
  extrasTotal: number;
  grandTotal: number;
  ssTot: number;
  iovTot: number;
  ssIva: number;
  iovIva: number;
  deposits: {
    firstDepositSS: number;
    secondDepositIovino: number;
    finalBalanceSS: number;
    finalBalanceIovino: number;
    finalBalanceTotal: number;
  };
}

export function calculateWeddingSimulation(input: WeddingSimulationInput): WeddingSimulationResult {
  const adults = Math.max(1, input.adultsCount || 100);
  const kids = Math.max(0, input.childrenCount || 0);

  let basePrice = adults >= 100 ? 130 : 140;
  if (input.menuType === 'mandarancio') basePrice += 10;
  if (input.menuType === 'arancio') basePrice += 20;

  const adultsTotal = basePrice * adults;
  const kidsTotal = kids * 50;
  const receptionTotal = adultsTotal + kidsTotal;

  const receptionSplit = calculateServiceSplit(receptionTotal, "40_60");

  let extrasSSNet = 0;
  let extrasIovNet = 0;
  let extrasSSIva = 0;
  let extrasIovIva = 0;
  let extrasTotal = 0;

  (input.extras || []).forEach(extra => {
    const cost = extra.prezzo_unitario * (extra.quantita || 1);
    extrasTotal += cost;
    const split = calculateServiceSplit(cost, extra.splitKey || "40_60", extra.splitLabel || "");
    extrasSSNet += split.santoStefanoNet;
    extrasIovNet += split.iovinoNet;
    extrasSSIva += split.santoStefanoIva;
    extrasIovIva += split.iovinoIva;
  });

  const ssNet = receptionSplit.santoStefanoNet + extrasSSNet;
  const iovNet = receptionSplit.iovinoNet + extrasIovNet;
  const ssIva = Math.round((ssNet * 0.22) * 100) / 100;
  const iovIva = Math.round((iovNet * 0.10) * 100) / 100;
  const ssTot = Math.round((ssNet + ssIva) * 100) / 100;
  const iovTot = Math.round((iovNet + iovIva) * 100) / 100;
  const grandTotal = Math.round((ssTot + iovTot) * 100) / 100;

  const firstDepositSS = 1500;
  const secondDepositIovino = 3000;
  const finalBalanceSS = Math.max(0, Math.round((ssTot - firstDepositSS) * 100) / 100);
  const finalBalanceIovino = Math.max(0, Math.round((iovTot - secondDepositIovino) * 100) / 100);

  return {
    adultsCount: adults,
    adultPriceUnit: basePrice,
    adultsTotal,
    childrenCount: kids,
    childrenTotal: kidsTotal,
    receptionTotal,
    extrasTotal,
    grandTotal,
    ssTot,
    iovTot,
    ssIva,
    iovIva,
    deposits: {
      firstDepositSS,
      secondDepositIovino,
      finalBalanceSS,
      finalBalanceIovino,
      finalBalanceTotal: Math.round((finalBalanceSS + finalBalanceIovino) * 100) / 100
    }
  };
}

export interface EventCashflowBreakdown {
  id: string;
  quoteId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  eventType: 'wedding' | 'privato';
  eventDate: string;
  guestsCount: number;
  totalContracted: number;
  ssTot: number;
  iovTot: number;
  firstDepositAmount: number;
  firstDepositPaid: boolean;
  secondDepositAmount: number;
  secondDepositPaid: boolean;
  ssFinalBalance: number;
  iovFinalBalance: number;
  totalFinalBalance: number;
  urgency: 'overdue' | 'critical' | 'upcoming' | 'planned';
}

export function computeEventCashflow(
  event: {
    id: string;
    quoteId?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    eventType: 'wedding' | 'privato';
    eventDate: string;
    guestsCount: number;
    totalGross?: number;
    firstDepositPaid?: boolean;
    secondDepositPaid?: boolean;
  },
  referenceDate = new Date()
): EventCashflowBreakdown {
  const eventDateObj = new Date(event.eventDate || new Date().toISOString());
  const diffTime = eventDateObj.getTime() - referenceDate.getTime();
  const daysUntilEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const totalContracted = event.totalGross || 0;
  const split = calculateServiceSplit(totalContracted, "40_60");
  const ssTot = split.santoStefanoTotal;
  const iovTot = split.iovinoTotal;

  const firstDepositAmount = 1500;
  const secondDepositAmount = 3000;
  const firstPaid = Boolean(event.firstDepositPaid);
  const secondPaid = Boolean(event.secondDepositPaid);

  const ssPaid = firstPaid ? firstDepositAmount : 0;
  const iovPaid = secondPaid ? secondDepositAmount : 0;

  const ssFinalBalance = Math.max(0, Math.round((ssTot - ssPaid) * 100) / 100);
  const iovFinalBalance = Math.max(0, Math.round((iovTot - iovPaid) * 100) / 100);

  let urgency: 'planned' | 'overdue' | 'critical' | 'upcoming' = 'planned';
  if (daysUntilEvent < 0) urgency = 'overdue';
  else if (daysUntilEvent <= 30) urgency = 'critical';
  else if (daysUntilEvent <= 180) urgency = 'upcoming';

  return {
    id: event.id,
    quoteId: event.quoteId,
    clientName: event.clientName,
    clientEmail: event.clientEmail,
    clientPhone: event.clientPhone,
    eventType: event.eventType,
    eventDate: event.eventDate,
    guestsCount: event.guestsCount,
    totalContracted,
    ssTot,
    iovTot,
    firstDepositAmount,
    firstDepositPaid: firstPaid,
    secondDepositAmount,
    secondDepositPaid: secondPaid,
    ssFinalBalance,
    iovFinalBalance,
    totalFinalBalance: Math.round((ssFinalBalance + iovFinalBalance) * 100) / 100,
    urgency
  };
}
