import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

/** Load `.env.production` then `.env.local` (local wins). Does not mutate process.env unless requested. */
export function loadProjectEnv() {
  return {
    ...parseEnvFile(join(root, ".env.production")),
    ...parseEnvFile(join(root, ".env.local")),
    ...process.env,
  };
}

export function applyProjectEnv() {
  Object.assign(process.env, loadProjectEnv());
  return loadProjectEnv();
}
