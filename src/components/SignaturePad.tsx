"use client";

import { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onEnd: (dataUrl: string) => void;
  label: string;
  initialData?: string;
}

export default function SignaturePad({ onEnd, label, initialData }: SignaturePadProps) {
  const padRef = useRef<SignatureCanvas>(null);

  const resizeCanvas = () => {
    if (padRef.current) {
      const canvas = padRef.current.getCanvas();
      // Solo se la larghezza cambia davvero
      if (canvas.offsetWidth && canvas.width !== canvas.offsetWidth) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        
        // Salva la firma corrente prima di ridimensionare
        let savedData = null;
        if (!padRef.current.isEmpty()) {
          savedData = padRef.current.toDataURL();
        } else if (initialData) {
          savedData = initialData;
        }

        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // Ripristina la firma per non perderla se si ruota lo schermo
        if (savedData) {
          padRef.current.fromDataURL(savedData);
        } else {
          padRef.current.clear();
        }
      }
    }
  };

  useEffect(() => {
    // Timeout necessario affinché il DOM finisca di renderizzare il div genitore e gli dia un offsetWidth reale
    const t = setTimeout(resizeCanvas, 100);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [initialData]);

  // Carica i dati iniziali dalla bozza
  useEffect(() => {
    if (initialData && padRef.current && padRef.current.isEmpty()) {
      setTimeout(() => {
        if (padRef.current && padRef.current.isEmpty()) {
          padRef.current.fromDataURL(initialData);
        }
      }, 150);
    }
  }, [initialData]);

  const clear = (e: React.MouseEvent) => {
    e.preventDefault();
    if (padRef.current) {
      padRef.current.clear();
      onEnd("");
    }
  };

  const handleEnd = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onEnd(padRef.current.toDataURL());
    } else {
      onEnd("");
    }
  };

  return (
    <div className="form-group full" style={{ marginTop: "1.5rem" }}>
      <label>{label} *</label>
      <div className="signature-pad-container" style={{ width: "100%" }}>
        <SignatureCanvas
          ref={padRef}
          penColor="black"
          canvasProps={{
            style: { width: "100%", height: "200px", touchAction: "none" },
            className: "sigCanvas"
          }}
          onEnd={handleEnd}
        />
      </div>
      <div className="signature-actions">
        <button className="btn-clear" onClick={clear}>Cancella firma</button>
      </div>
    </div>
  );
}
