import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getPresentationAnalytics,
  getPresentationsDynamic,
  savePresentationsManifest,
} from "@/lib/presentazioniCloud";
import { Presentation } from "@/lib/presentazioni";

export async function GET() {
  try {
    const [presentations, analytics] = await Promise.all([
      getPresentationsDynamic(),
      getPresentationAnalytics(),
    ]);
    return NextResponse.json({
      success: true,
      presentations,
      analytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Errore caricamento presentazioni" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updatedList = body?.presentations as Presentation[] | undefined;

    if (!Array.isArray(updatedList) || updatedList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lista presentazioni non valida" },
        { status: 400 }
      );
    }

    const saved = await savePresentationsManifest(updatedList);

    revalidatePath("/presentazioni");
    for (const item of saved) {
      revalidatePath(`/presentazioni/${item.slug}`);
    }

    return NextResponse.json({
      success: true,
      presentations: saved,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Errore salvataggio presentazioni" },
      { status: 500 }
    );
  }
}
