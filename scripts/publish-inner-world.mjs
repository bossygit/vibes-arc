/**
 * Publie le « Monde intérieur » (Image Streaming × rêves) dans Supabase, sans
 * `npm run dev` : lit le coffre Obsidian avec le même code que l'app
 * (server/innerWorldVault.ts) puis l'envoie à coach-api (POST /inner-world).
 *
 * Lancé automatiquement par le bot Image Streaming après chaque séance,
 * `/paralleles` ou confirmation d'exercice ; utilisable à la main :
 *
 *   node scripts/publish-inner-world.mjs --dry-run   # construit et résume, n'envoie rien
 *   node scripts/publish-inner-world.mjs             # publie
 *
 * Variables d'environnement :
 *   VIBES_ARC_API_URL   URL de coach-api (…/functions/v1/coach-api)
 *   VIBES_ARC_API_KEY   clé de coach-api (COACH_API_KEY côté Supabase)
 *   VIBES_ARC_USER_ID   ton identifiant utilisateur Supabase
 *   OBSIDIAN_VAULT_PATH, INNER_WORLD_IS_DIR, INNER_WORLD_DREAMS_DIR (facultatives, mêmes défauts que l'app)
 *
 * Sortie : une ligne JSON sur stdout ({ ok, … }) ; code 0 si succès, 1 sinon.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const dryRun = process.argv.includes('--dry-run');

function done(result, code) {
    console.log(JSON.stringify(result));
    process.exit(code);
}

const outDir = mkdtempSync(path.join(tmpdir(), 'vibes-inner-world-'));
let snapshot;
try {
    await build({
        entryPoints: [path.join(ROOT, 'server', 'innerWorldVault.ts')],
        bundle: true,
        format: 'esm',
        platform: 'node',
        outfile: path.join(outDir, 'vault.mjs'),
        logLevel: 'silent',
    });
    const { readInnerWorldSnapshot, resolveVaultConfig } = await import(pathToFileURL(path.join(outDir, 'vault.mjs')).href);
    snapshot = await readInnerWorldSnapshot(resolveVaultConfig((key) => process.env[key]));
} catch (error) {
    done({ ok: false, error: `lecture du coffre impossible : ${error?.message ?? error}` }, 1);
} finally {
    rmSync(outDir, { recursive: true, force: true });
}

if (!snapshot) done({ ok: false, error: 'coffre introuvable (dossiers Image Streaming et rêves absents)' }, 1);

const body = JSON.stringify(snapshot);
const summary = {
    sessions: snapshot.sessions.length,
    dreams: snapshot.dreams.length,
    symbols: snapshot.symbols.length,
    parallels: snapshot.parallels?.length ?? 0,
    practice: snapshot.practice?.length ?? 0,
    activePractice: (snapshot.practice ?? []).filter((p) => p.status === 'active').length,
    bytes: Buffer.byteLength(body),
};
if (dryRun) done({ ok: true, dryRun: true, ...summary }, 0);

const { VIBES_ARC_API_URL: apiUrl, VIBES_ARC_API_KEY: apiKey, VIBES_ARC_USER_ID: userId } = process.env;
if (!apiUrl || !apiKey || !userId) {
    done({ ok: false, error: 'VIBES_ARC_API_URL, VIBES_ARC_API_KEY et VIBES_ARC_USER_ID sont requises', ...summary }, 1);
}

try {
    const url = `${apiUrl.replace(/\/+$/, '')}/inner-world?user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body,
        signal: AbortSignal.timeout(60_000),
    });
    const text = await res.text();
    let payload;
    try {
        payload = JSON.parse(text);
    } catch {
        payload = { raw: text.slice(0, 300) };
    }
    if (!res.ok) done({ ok: false, status: res.status, error: payload?.error ?? payload, ...summary }, 1);
    done({ ok: true, ...summary, syncedAt: payload.syncedAt }, 0);
} catch (error) {
    done({ ok: false, error: `envoi impossible : ${error?.message ?? error}`, ...summary }, 1);
}
