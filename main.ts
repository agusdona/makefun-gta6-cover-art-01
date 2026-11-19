// Vice Cover Lab — entry program (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository into the output
// directory and writes the entry dossier there with buildDossier from
// vendor/makefun-app.ts. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output. Writes happen only under the output directory, never in the
// repository, so the program also runs from a read-only checkout.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(sourceName) {
  const source = resolve(repoRoot, sourceName);
  const target = resolve(outputDir, sourceName);
  if (!existsSync(source)) return;
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
rmSync(resolve(outputDir, 'app'), { recursive: true, force: true });
rmSync(resolve(outputDir, 'screenshots'), { recursive: true, force: true });
rmSync(resolve(outputDir, 'dossier.json'), { force: true });
copyTree('app');
copyTree('screenshots');
writeFileSync(resolve(outputDir, 'dossier.json'), buildDossier(outputDir, dossierCaps));
console.log(`wrote ${outputDir}/dossier.json`);
