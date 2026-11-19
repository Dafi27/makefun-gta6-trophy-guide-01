// Leonida Trophy Guide: hand the guide in.
//
// Copies app/ and screenshots/ from this repository to the output
// directory and writes dossier.json there with buildDossier from
// vendor/makefun-frontend.ts. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The repository root is the directory this file lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// The gate's caps for this competition, from its rules.
const caps = {
  text_max_bytes: 163840,
  dossier_max_bytes: 1572864,
  max_images: 4,
  app_max_files: 993,
  app_max_bytes: 50331648,
  index_html_max_bytes: 1048576,
};

function copyDir(name) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  cpSync(from, to, { recursive: true });
  return to;
}

mkdirSync(outDir, { recursive: true });
copyDir("app");
copyDir("screenshots");

// Build the dossier from the copied app/ and screenshots/ in the
// output directory, so it is byte for byte what the gate rebuilds
// from /output, then write it next to them.
const dossier = await buildDossier(outDir, caps);
const dossierPath = join(outDir, "dossier.json");
writeFileSync(dossierPath, dossier);
console.log(`wrote ${dossierPath} (${dossier.length} bytes)`);
