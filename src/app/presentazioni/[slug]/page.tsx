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

  return {
    title: `${presentation.title} | La Terra degli Aranci`,
    description: presentation.description,
    openGraph: {
      title: `${presentation.title} | La Terra degli Aranci`,
      description: presentation.description,
      images: [presentation.coverImage],
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
