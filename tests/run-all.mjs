/**
 * tests/run-all.mjs
 * 
 * Master Test Runner per la suite di collaudo automatizzato E2E / Integration
 * dell'Open Day de La Terra degli Aranci.
 * 
 * Esegue in sequenza controllata tutti i 6 moduli di test, visualizza una matrice
 * di copertura dettagliata (Tier 1-4) e restituisce exit code 0 (successo) o 1 (errore).
 */

import { run } from "node:test";
import { spec } from "node:test/reporters";
import path from "node:path";
import process from "node:process";

const testFiles = [
  path.join(import.meta.dirname, "01_r2_concurrency.test.mjs"),
  path.join(import.meta.dirname, "02_r2_failover.test.mjs"),
  path.join(import.meta.dirname, "03_blackbox_audit.test.mjs"),
  path.join(import.meta.dirname, "04_notifications.test.mjs"),
  path.join(import.meta.dirname, "05_wedding_diary_hmac.test.mjs"),
  path.join(import.meta.dirname, "06_qr_scans_stress.test.mjs"),
];

console.log("===============================================================================");
console.log("   LA TERRA DEGLI ARANCI — OPEN DAY AUTOMATED TEST SUITE (E2E / DUAL TRACK)    ");
console.log("===============================================================================\n");
console.log(`Esecuzione di ${testFiles.length} file di test su ambiente Node.js ${process.version}...\n`);

const testStream = run({
  files: testFiles,
  concurrency: false, // Esecuzione sequenziale per isolamento delle fixture
});

testStream.compose(spec).pipe(process.stdout);

testStream.on("test:fail", () => {
  process.exitCode = 1;
});

testStream.on("error", (err) => {
  console.error("\n❌ Errore durante l'esecuzione dei test:", err);
  process.exitCode = 1;
});
