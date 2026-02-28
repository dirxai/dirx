/**
 * Generate command: scan project and update DIR.md/dir.json.
 *
 * Purely local by default. With --register, also registers with the gateway.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { detectFramework, scanRoutes } from "@dirxai/core";

export interface GenerateOptions {
    register?: boolean;
    gatewayUrl?: string;
    token?: string;
    domain?: string;
}

export async function runGenerate(
    dir: string,
    opts?: GenerateOptions,
): Promise<void> {
    const target = dir === "." ? process.cwd() : dir;
    const dirJsonPath = join(target, "dir.json");

    if (!existsSync(dirJsonPath)) {
        console.error(
            `dir.json not found in ${target}. Run 'dirx init' first.`,
        );
        process.exitCode = 1;
        return;
    }

    const { framework } = detectFramework(target);
    const routes = scanRoutes(target, framework);

    console.log(`Scanned ${target} (${framework})`);
    if (routes.length > 0) {
        console.log(`\nFound ${routes.length} file(s) with route definitions:\n`);
        for (const r of routes) {
            console.log(`  ${r.file}  (${r.framework})`);
        }
    } else {
        console.log(`\nNo route definitions detected.`);
    }
    console.log(`\nEdit DIR.md and dir.json to describe your API.`);

    if (opts?.register) {
        console.log(`\nRegistering with gateway...`);
        const { runRegister } = await import("./register.js");
        await runRegister({
            gatewayUrl: opts.gatewayUrl,
            token: opts.token,
            domain: opts.domain,
            dir: target,
        });
    }
}
