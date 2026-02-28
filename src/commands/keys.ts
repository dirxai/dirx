/**
 * Keys command: manage external API keys (BYOK).
 *
 * Local + optional remote sync via BYOK API.
 */

import type { Command } from "commander";
import { createClient } from "../gateway/client.js";

interface KeyEntry {
    type: string;
    token?: string;
    header?: string;
    key?: string;
    updatedAt: string;
}

interface KeyStore {
    keys: Record<string, KeyEntry>;
}

async function loadKeyStore(): Promise<KeyStore> {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { homedir } = await import("node:os");

    const dirxHome = process.env.DIRX_HOME ?? join(homedir(), ".dirx");
    const filePath = join(dirxHome, "keys.json");
    try {
        const text = readFileSync(filePath, "utf-8");
        return JSON.parse(text) as KeyStore;
    } catch {
        return { keys: {} };
    }
}

async function saveKeyStore(store: KeyStore): Promise<void> {
    const { writeFileSync, mkdirSync, chmodSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { homedir } = await import("node:os");

    const dirxHome = process.env.DIRX_HOME ?? join(homedir(), ".dirx");
    const filePath = join(dirxHome, "keys.json");
    mkdirSync(dirxHome, { recursive: true });
    writeFileSync(filePath, JSON.stringify(store, null, 2));
    try {
        chmodSync(filePath, 0o600);
    } catch {
        // chmod not supported on all platforms
    }
}

export function registerKeysCommand(program: Command): void {
    const keys = program
        .command("keys")
        .description("Manage external API keys (BYOK)");

    keys
        .command("set")
        .description("Set an API key for a domain")
        .argument("<domain>", "API domain (e.g. api.github.com)")
        .requiredOption("--token <token>", "API token/key")
        .option("--type <type>", "Auth type (bearer, header, query)", "bearer")
        .option("--sync", "Also upload to the gateway")
        .action(
            async (
                domain: string,
                opts: { token: string; type: string; sync?: boolean },
            ) => {
                const store = await loadKeyStore();
                store.keys[domain] = {
                    type: opts.type,
                    token: opts.token,
                    updatedAt: new Date().toISOString(),
                };
                await saveKeyStore(store);
                console.log(`Key saved for ${domain}`);

                if (opts.sync) {
                    try {
                        const client = await createClient();
                        await client.uploadByok(domain, {
                            type: opts.type,
                            token: opts.token,
                        });
                        console.log(`Key synced to gateway`);
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        console.error(`Sync failed: ${msg}`);
                    }
                }
            },
        );

    keys
        .command("list")
        .description("List stored API keys")
        .option("--remote", "List keys stored on the gateway")
        .action(async (opts: { remote?: boolean }) => {
            if (opts.remote) {
                try {
                    const client = await createClient();
                    const result = await client.listByok();
                    console.log(JSON.stringify(result, null, 2));
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.error(`Error: ${msg}`);
                    process.exit(1);
                }
            } else {
                const store = await loadKeyStore();
                const domains = Object.keys(store.keys);
                if (domains.length === 0) {
                    console.log("No keys stored locally.");
                    return;
                }
                for (const domain of domains) {
                    const entry = store.keys[domain];
                    const hint =
                        entry.token
                            ? `${entry.token.slice(0, 4)}...${entry.token.slice(-4)}`
                            : "(set)";
                    console.log(`  ${domain}  ${entry.type}  ${hint}  ${entry.updatedAt}`);
                }
            }
        });

    keys
        .command("remove")
        .description("Remove an API key for a domain")
        .argument("<domain>", "API domain")
        .option("--remote", "Also delete from the gateway")
        .action(async (domain: string, opts: { remote?: boolean }) => {
            const store = await loadKeyStore();
            if (store.keys[domain]) {
                delete store.keys[domain];
                await saveKeyStore(store);
                console.log(`Key removed for ${domain}`);
            } else {
                console.log(`No key found for ${domain}`);
            }

            if (opts.remote) {
                try {
                    const client = await createClient();
                    await client.deleteByok(domain);
                    console.log(`Key deleted from gateway`);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.error(`Remote delete failed: ${msg}`);
                }
            }
        });
}
