"use client";

import { useState } from "react";

export default function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
      <input 
        type="text" 
        readOnly 
        value={link} 
        style={{ width: "100%", padding: "1rem", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "white", fontWeight: "600", color: "#333" }} 
      />
      <button 
        type="button" 
        onClick={handleCopy} 
        style={{ 
          padding: "1rem 1.5rem", 
          background: copied ? "#2d5a27" : "#e58c2c", 
          color: "white", 
          border: "none", 
          borderRadius: "6px", 
          fontWeight: "bold", 
          cursor: "pointer", 
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(229, 140, 44, 0.3)"
        }}
      >
        {copied ? "Copaito! ✓" : "📋 Copia Link Contratto"}
      </button>
    </div>
  );
}
