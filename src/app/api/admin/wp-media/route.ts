import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const search = searchParams.get("search") || "";

  try {
    let wpUrl = `https://www.laterradegliaranci.it/wp-json/wp/v2/media?per_page=50&page=${page}`;
    if (search) {
      wpUrl += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(wpUrl, {
      headers: {
        "User-Agent": "AntigravityEcosystemBridge/1.0"
      },
      next: { revalidate: 60 }
    });

    if (res.ok) {
      const data = await res.json();
      const formatted = data.map((m: any) => ({
        id: m.id,
        title: m.title?.rendered || `Media #${m.id}`,
        url: m.source_url,
        thumbnail: m.media_details?.sizes?.thumbnail?.source_url || m.source_url
      }));
      return NextResponse.json({ success: true, media: formatted });
    }
  } catch (e: any) {
    console.warn("WP Media fetch fallback:", e.message);
  }

  // Fallback curated media assets from La Terra degli Aranci
  const fallbackMedia = [
    {
      id: 101,
      title: "Menu Vegano Eco-Chic TDA",
      url: "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg",
      thumbnail: "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg"
    },
    {
      id: 102,
      title: "Piatto Gourmet Plant-Based",
      url: "https://laterradegliaranci.it/wp-content/uploads/2025/01/c42f8af69b00ef4678797b3b0241ac2e.jpg",
      thumbnail: "https://laterradegliaranci.it/wp-content/uploads/2025/01/c42f8af69b00ef4678797b3b0241ac2e.jpg"
    },
    {
      id: 103,
      title: "Sala Ricevimenti La Terra degli Aranci",
      url: "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg",
      thumbnail: "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg"
    },
    {
      id: 104,
      title: "Giardino delle Promesse Cerimonia",
      url: "https://laterradegliaranci.it/wp-content/uploads/2024/07/giardino-promesse.jpg",
      thumbnail: "https://laterradegliaranci.it/wp-content/uploads/2024/07/giardino-promesse.jpg"
    },
    {
      id: 105,
      title: "Agrumeto Storico e Parco 6000mq",
      url: "https://laterradegliaranci.it/wp-content/uploads/2024/07/parco-agrumeto.jpg",
      thumbnail: "https://laterradegliaranci.it/wp-content/uploads/2024/07/parco-agrumeto.jpg"
    }
  ];

  return NextResponse.json({ success: true, media: fallbackMedia });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `media/blog/${Date.now()}_${cleanBase}${ext}`;

    try {
      // 1. Prova upload su Cloudflare R2
      const publicUrl = await uploadImageToR2(buffer, fileName, file.type || "image/jpeg");
      return NextResponse.json({
        success: true,
        url: publicUrl,
        title: file.name,
        source: "r2"
      });
    } catch (r2Err: any) {
      console.warn("R2 upload fallback to local public directory:", r2Err.message);

      // 2. Fallback upload in local directory public/uploads
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFileName = `${Date.now()}_${cleanBase}${ext}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      fs.writeFileSync(localFilePath, buffer);

      const localUrl = `/uploads/${localFileName}`;
      return NextResponse.json({
        success: true,
        url: localUrl,
        title: file.name,
        source: "local"
      });
    }
  } catch (error: any) {
    console.error("Errore upload immagine:", error);
    return NextResponse.json({ error: error.message || "Errore durante il caricamento" }, { status: 500 });
  }
}
