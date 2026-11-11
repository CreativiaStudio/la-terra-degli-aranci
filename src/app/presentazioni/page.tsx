import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getAllPresentations } from "@/lib/presentazioni";

export const metadata: Metadata = {
  title: "Presentazioni Ufficiali | La Terra degli Aranci",
  description:
    "Esplora i format, gli spazi e le esperienze esclusive di Villa La Terra degli Aranci attraverso le presentazioni interattive dedicate: nozze, eventi aziendali e album fotografici.",
  openGraph: {
    title: "Presentazioni Ufficiali | La Terra degli Aranci",
    description:
      "Esplora i format, gli spazi e le esperienze esclusive di Villa La Terra degli Aranci attraverso le presentazioni interattive dedicate.",
    type: "website",
    locale: "it_IT",
  },
};

const WHATSAPP_URL =
  "https://wa.me/390817148768?text=Buongiorno%2C%20vorrei%20informazioni%20sulle%20presentazioni%20La%20Terra%20degli%20Aranci";

function SlideIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#E58C2C]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="12" rx="2" />
      <path d="M6 21h12" />
      <path d="M12 17v4" />
    </svg>
  );
}

export default function PresentazioniHubPage() {
  const presentations = getAllPresentations();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0e1015] text-[#FAF8F5]">
      {/* Bagliori decorativi oro / verde botanico */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#E58C2C] opacity-[0.09] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[22rem] w-[30rem] translate-x-1/4 rounded-full bg-[#2D5A27] opacity-[0.12] blur-3xl"
      />

      <div className="relative">
        {/* Header */}
        <header className="mx-auto max-w-5xl px-4 pt-16 pb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#E58C2C]">
            La Terra degli Aranci
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#FAF8F5] sm:text-5xl">
            Presentazioni Ufficiali
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#FAF8F5]/70 sm:text-lg">
            Esplora i format, gli spazi e le esperienze esclusive di Villa La
            Terra degli Aranci attraverso le presentazioni interattive
            dedicate.
          </p>
        </header>

        {/* Griglia presentazioni */}
        <main
          className="grid grid-cols-1 gap-6 py-8 mx-auto max-w-5xl px-4 md:grid-cols-2"
          role="list"
        >
          {presentations.map((presentation) => (
            <Link
              key={presentation.slug}
              href={`/presentazioni/${presentation.slug}`}
              role="listitem"
              className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/40 backdrop-blur-sm transition-colors duration-300 hover:border-[#E58C2C]/50 hover:bg-white/[0.07]"
            >
              {/* Copertina 16:9 con micro-hover zoom */}
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={presentation.coverImage}
                  alt={`Copertina — ${presentation.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 512px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0e1015]/70 via-transparent to-transparent"
                />
                {presentation.badge ? (
                  <span className="absolute top-3 right-3 rounded-full bg-[#E58C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#2B2B2B] shadow-md">
                    {presentation.badge}
                  </span>
                ) : null}
              </div>

              {/* Contenuto card */}
              <div className="flex flex-col gap-3 p-5">
                <h2 className="font-serif text-xl font-semibold text-[#FAF8F5] transition-colors duration-300 group-hover:text-[#E58C2C]">
                  {presentation.title}
                </h2>
                <p className="text-sm font-medium text-[#E58C2C]/90">
                  {presentation.subtitle}
                </p>
                <p className="text-sm leading-relaxed text-[#FAF8F5]/60">
                  {presentation.description}
                </p>

                <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="inline-flex items-center gap-2 text-xs text-[#FAF8F5]/60">
                    <SlideIcon />
                    {presentation.totalSlides} slide interattive
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E58C2C] px-4 py-2 text-xs font-semibold text-[#2B2B2B] shadow-md transition-transform duration-300 group-hover:translate-x-1">
                    Sfoglia Presentazione
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 px-4 py-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#E58C2C]/40 px-5 py-2 text-sm font-medium text-[#E58C2C] transition-colors duration-300 hover:bg-[#E58C2C]/10"
            >
              WhatsApp rapido
              <span aria-hidden="true">›</span>
            </a>
            <p className="text-xs leading-relaxed text-[#FAF8F5]/50">
              Segreteria: segreteriatda@gmail.com · Un Giardino di Emozioni nel
              Cuore di Napoli
            </p>
            <p className="text-xs text-[#FAF8F5]/40">
              © {new Date().getFullYear()} La Terra degli Aranci · Santo Stefano
              S.r.l. · Iovino Banqueting S.r.l. — Tutti i diritti riservati
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
