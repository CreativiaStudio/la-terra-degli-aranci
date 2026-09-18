import React, { useState, useEffect, useRef } from 'react';

interface WaxSealProps {
  monogram?: string;
  onClick?: () => void;
  isBroken?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPrompt?: boolean;
  animate?: boolean;
  idPrefix?: string;
  /** Colore ceralacca in RGB (default: carminio V1; la V2 usa un rubino più profondo). */
  color?: [number, number, number];
  /** Filtro CSS opzionale per la base in ceralacca (es. rubino più vivo in V2). */
  waxFilter?: string;
  /** V2: aggiunge un velo dorato rotante che simula una ceralacca cangiante artigianale. */
  luxe?: boolean;
}

const DEFAULT_WAX_COLOR: [number, number, number] = [96, 14, 18];

function renderWaxSealMonogram(
  canvas: HTMLCanvasElement,
  text: string,
  W: number,
  color: [number, number, number] = [96, 14, 18]
) {
  const H = W;
  canvas.width = W;
  canvas.height = H;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch (e) {
    return;
  }
  if (!ctx) return;

  const font = '"Carattere", "Rouge Script", "Great Vibes", cursive';
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };

  const partes = text.split('&');
  const A = (partes[0] || '').trim();
  const B = (partes[1] || '').trim();
  const amp = partes.length > 1;

  const m = mk();
  const mc = m.getContext('2d');
  if (!mc) return;

  let fs = W * 0.46;
  mc.textBaseline = 'middle';
  mc.fillStyle = '#000';
  mc.lineJoin = 'round';
  mc.strokeStyle = '#000';

  function medidas(f: number) {
    if (!mc) return { wa: 0, wb: 0, wm: 0, gap: 0, total: 0 };
    mc.font = f + 'px ' + font;
    const wa = mc.measureText(A).width;
    const wb = mc.measureText(B).width;
    mc.font = f * 0.6 + 'px ' + font;
    const wm = amp ? mc.measureText('&').width : 0;
    const gap = amp ? f * 0.08 : 0;
    return { wa, wb, wm, gap, total: wa + wb + wm + gap * 2 };
  }

  let md = medidas(fs);
  for (let i = 0; i < 16; i++) {
    if (md.total <= W * 0.60) break;
    fs *= 0.94;
    md = medidas(fs);
  }

  let x = W / 2 - md.total / 2;
  const ty = H / 2 + fs * 0.04;
  mc.textAlign = 'left';
  mc.lineWidth = fs * 0.035;
  mc.font = fs + 'px ' + font;
  mc.strokeText(A, x, ty);
  mc.fillText(A, x, ty);
  x += md.wa + md.gap;

  if (amp) {
    mc.font = fs * 0.6 + 'px ' + font;
    mc.strokeText('&', x, ty + fs * 0.02);
    mc.fillText('&', x, ty + fs * 0.02);
    x += md.wm + md.gap;
  }

  mc.font = fs + 'px ' + font;
  mc.strokeText(B, x, ty);
  mc.fillText(B, x, ty);

  // Optical ink centering
  const imgData = mc.getImageData(0, 0, W, H);
  const d = imgData.data;
  let x0 = W,
    x1 = 0,
    y0 = H,
    y1 = 0;
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (d[(yy * W + xx) * 4 + 3] > 20) {
        if (xx < x0) x0 = xx;
        if (xx > x1) x1 = xx;
        if (yy < y0) y0 = yy;
        if (yy > y1) y1 = yy;
      }
    }
  }
  if (x1 > x0) {
    const dx = Math.round(W / 2 - (x0 + x1) / 2);
    const dy = Math.round(H / 2 - (y0 + y1) / 2);
    if (dx || dy) {
      const cp = mk();
      const cpc = cp.getContext('2d');
      if (cpc) {
        cpc.drawImage(m, 0, 0);
        mc.clearRect(0, 0, W, H);
        mc.drawImage(cp, dx, dy);
      }
    }
  }

  // Relief heightmap + 3-pass sliding window box blur
  const R = Math.max(1, Math.round(W * 0.012));
  const Adat = mc.getImageData(0, 0, W, H).data;
  const N = W * H;
  const hgt = new Float32Array(N);
  const tmp = new Float32Array(N);
  for (let q = 0; q < N; q++) hgt[q] = Adat[q * 4 + 3] / 255;

  function blur1(src: Float32Array, dst: Float32Array, rad: number) {
    const w = W,
      h = H,
      len = rad * 2 + 1;
    for (let yy = 0; yy < h; yy++) {
      let acc = 0;
      for (let k = -rad; k <= rad; k++) acc += src[yy * w + Math.min(w - 1, Math.max(0, k))];
      for (let xx = 0; xx < w; xx++) {
        dst[yy * w + xx] = acc / len;
        acc +=
          src[yy * w + Math.min(w - 1, xx + rad + 1)] -
          src[yy * w + Math.max(0, xx - rad)];
      }
    }
    for (let xx = 0; xx < w; xx++) {
      let acc = 0;
      for (let k = -rad; k <= rad; k++) acc += dst[Math.min(h - 1, Math.max(0, k)) * w + xx];
      for (let yy = 0; yy < h; yy++) {
        src[yy * w + xx] = acc / len;
        acc +=
          dst[Math.min(h - 1, yy + rad + 1) * w + xx] -
          dst[Math.max(0, yy - rad) * w + xx];
      }
    }
  }

  blur1(hgt, tmp, R);
  blur1(hgt, tmp, R);
  blur1(hgt, tmp, R);

  // Lighting vectors: directional light from top-left (North-West)
  let Lx = -0.55,
    Ly = -0.62,
    Lz = 0.56;
  const Ln = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz);
  Lx /= Ln;
  Ly /= Ln;
  Lz /= Ln;

  let Hx = Lx,
    Hy = Ly,
    Hz = Lz + 1;
  const Hn = Math.sqrt(Hx * Hx + Hy * Hy + Hz * Hz);
  Hx /= Hn;
  Hy /= Hn;
  Hz /= Hn;

  const fuerza = W * 0.06;
  const o = mk();
  const oc = o.getContext('2d');
  if (!oc) return;
  const out = oc.createImageData(W, H);
  const Dd = out.data;

  const [cr, cg, cb] = color;
  const amb = 0.65,
    difK = 0.45,
    spec = 0.65,
    expo = 20;

  for (let y2 = 0; y2 < H; y2++) {
    for (let x2 = 0; x2 < W; x2++) {
      const qq = y2 * W + x2;
      const a = Adat[qq * 4 + 3];
      if (a < 8) continue;

      const hl = hgt[qq - (x2 > 0 ? 1 : 0)];
      const hr = hgt[qq + (x2 < W - 1 ? 1 : 0)];
      const hu = hgt[qq - (y2 > 0 ? W : 0)];
      const hd = hgt[qq + (y2 < H - 1 ? W : 0)];

      let nx = (hl - hr) * fuerza;
      let ny = (hu - hd) * fuerza;
      const nn = Math.sqrt(nx * nx + ny * ny + 1);
      nx /= nn;
      ny /= nn;
      const nz = 1 / nn;

      const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
      const sp = Math.pow(Math.max(0, nx * Hx + ny * Hy + nz * Hz), expo) * spec;
      const sh = amb + difK * dif;

      Dd[qq * 4] = Math.min(255, cr * sh + 255 * sp);
      Dd[qq * 4 + 1] = Math.min(255, cg * sh + 255 * sp);
      Dd[qq * 4 + 2] = Math.min(255, cb * sh + 255 * sp);
      Dd[qq * 4 + 3] = a;
    }
  }

  oc.putImageData(out, 0, 0);

  // Contact shadow: letters sink into the wax floor
  const sc = mk();
  const scc = sc.getContext('2d');
  if (scc) {
    scc.shadowColor = 'rgba(0,0,0,.60)';
    scc.shadowBlur = W * 0.02;
    scc.shadowOffsetX = W * 0.008;
    scc.shadowOffsetY = W * 0.011;
    scc.drawImage(m, 0, 0);
    scc.shadowColor = 'transparent';
    scc.globalCompositeOperation = 'destination-out';
    scc.drawImage(m, 0, 0);
  }

  ctx.clearRect(0, 0, W, H);
  if (scc) ctx.drawImage(sc, 0, 0);
  ctx.drawImage(o, 0, 0);
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  monogram = 'F & F',
  onClick,
  isBroken = false,
  className = '',
  size = 'lg',
  showPrompt = true,
  animate = true,
  color = DEFAULT_WAX_COLOR,
  waxFilter,
  luxe = false,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Size configurations
  const sizeClasses = {
    lg: 'w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    sm: 'w-18 h-18 sm:w-20 sm:h-20',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
      const baseW = size === 'lg' ? 220 : size === 'md' ? 140 : 96;
      const W = Math.round(baseW * dpr);
      renderWaxSealMonogram(canvas, monogram, W, color);
    };

    render();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(render);
      if (document.fonts.load) {
        document.fonts.load('40px "Carattere"').then(render).catch(() => {});
      }
    }
  }, [monogram, size, color]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Interactive Wax Seal Disc (Clean, natural drop shadow - no dark halo smudge) */}
      <button
        type="button"
        onMouseDown={() => setIsPressing(true)}
        onMouseUp={() => setIsPressing(false)}
        onTouchStart={() => setIsPressing(true)}
        onTouchEnd={() => setIsPressing(false)}
        onClick={onClick}
        className={`group relative ${sizeClasses[size]} rounded-full cursor-pointer select-none transition-all duration-500 transform 
          ${isPressing ? 'scale-95 brightness-90 shadow-inner' : 'hover:scale-105 hover:rotate-1'}
          ${isBroken ? 'opacity-0 pointer-events-none scale-125 transition-opacity duration-700' : 'opacity-100'}
          ${animate && !isBroken ? 'animate-sealBreathe' : ''}
        `}
        style={{
          filter: 'drop-shadow(0 4px 10px rgba(35, 4, 8, 0.35))',
        }}
        aria-label={
          showPrompt
            ? 'Apri invito nuziale con sigillo in ceralacca'
            : 'Sigillo in ceralacca Francesca e Ferdinando'
        }
      >
        {/* Real Molten Carmine Wax Texture Base (High Resolution Transparent PNG) */}
        <img
          src="./images/ceralacca_base.png"
          alt="Sigillo in Ceralacca"
          className="w-full h-full object-contain pointer-events-none select-none"
          style={waxFilter ? { filter: waxFilter } : undefined}
          draggable={false}
        />

        {/* V2 — Velo cangiante: riflesso dorato rotante sulla ceralacca artigianale */}
        {luxe && !isBroken && <div className="wax-seal-sheen" aria-hidden="true" />}

        {/* Central Bump-Mapped Monogram (Exact 3D Wax Emboss in Carattere) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </button>

      {/* Floating Prompt: "Tocca per aprire" */}
      {showPrompt && !isBroken && (
        <div className="absolute top-[106%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none whitespace-nowrap z-20">
          <span className="font-serif text-[11px] sm:text-xs uppercase tracking-[0.35em] text-gold-accent font-medium drop-shadow-sm animate-pulse">
            Tocca per aprire
          </span>
          <svg
            className="w-4 h-4 text-gold-accent animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default WaxSeal;
