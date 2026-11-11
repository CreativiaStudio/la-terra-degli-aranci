import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPresentationBySlug } from "@/lib/presentazioni";
import PresentationViewer from "@/components/presentazioni/PresentationViewer";

interface PresentationSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const presentation = getPresentationBySlug(slug);

  if (!presentation) {
    return {
      title: "Presentazione non trovata | La Terra degli Aranci",
      description:
        "La presentazione richiesta non è disponibile. Scopri le presentazioni ufficiali di La Terra degli Aranci.",
    };
  }

  const ogCardMap: Record<string, string> = {
    "wedding-it": "/og-wedding-it.jpg",
    "tda-presentation-2026-en": "/og-tda-2026-en.jpg",
    "aziendale": "/og-aziendale.jpg",
    "love-tales": "/og-love-tales.jpg",
  };

  const ogCardUrl = `https://ecosistema.laterradegliaranci.it${ogCardMap[slug] || "/og-presentazioni.jpg"}`;

  return {
    title: `${presentation.title} | La Terra degli Aranci`,
    description: presentation.description,
    openGraph: {
      title: `${presentation.title} | La Terra degli Aranci`,
      description: presentation.description,
      url: `https://ecosistema.laterradegliaranci.it/presentazioni/${slug}`,
      siteName: "La Terra degli Aranci",
      locale: "it_IT",
      type: "article",
      images: [
        {
          url: ogCardUrl,
          width: 1200,
          height: 630,
          alt: presentation.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${presentation.title} | La Terra degli Aranci`,
      description: presentation.description,
      images: [ogCardUrl],
    },
  };
}

export default async function PresentationSlugPage({
  params,
}: PresentationSlugPageProps) {
  const { slug } = await params;
  const presentation = getPresentationBySlug(slug);

  if (!presentation) {
    notFound();
  }

  return <PresentationViewer presentation={presentation} />;
}
