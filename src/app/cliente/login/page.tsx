import React, { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e1b18",
            color: "#e58c2c",
            fontFamily: "serif",
            fontSize: "1.2rem",
          }}
        >
          Caricamento Area Riservata...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
