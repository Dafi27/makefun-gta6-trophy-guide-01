// main.ts — Leonida Trophy Guide entrypoint.
//
// Hands the guide in: copies app/ and screenshots/ from this repository
// to the output directory and writes /output/dossier.json with buildDossier
// from vendor/makefun-frontend.ts (the kit's copy, unchanged).
//
// Runs on Node 22, standard library only. MAKEFUN_OUTPUT_DIR stands in
// for /output outside the grader. The program runs twice and both runs
// must write the same bytes, so the output directory is cleared first
// and everything written here is deterministic.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The repository root: this file lives at its root.
const root = dirname(fileURLToPath(import.meta.url));

// Where the entry goes. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output; the grader sets it to /output.
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// Start clean so a second run writes exactly the same bytes.
// The grader runs as an unprivileged user on a read-only filesystem
// with /output pre-created: deleting the output directory itself
// throws EACCES, so only clear its children, never the directory.
mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, "app"), { recursive: true, force: true });
rmSync(join(outDir, "screenshots"), { recursive: true, force: true });
rmSync(join(outDir, "dossier.json"), { force: true });

// The guide itself: app/ (index.html, styles, scripts, data) and
// screenshots/ (3 or 4 renders of the guide's own code).
cpSync(join(root, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(root, "screenshots"), join(outDir, "screenshots"), { recursive: true });

// The dossier: buildDossier reads app/ and screenshots/ from the
// repository root and returns the dossier.json bytes. Its text is
// capped at 163,840 UTF-8 bytes (160 KiB), the limit the rules set.
const dossier = buildDossier(root, { text_max_bytes: 163840 });
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log("wrote " + join(outDir, "dossier.json") + " (" + dossier.length + " bytes)");
