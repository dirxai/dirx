/**
 * Register command: register a service's DIR.md with the gateway.
 *
 * Public endpoint: POST /registry/services?domain=...
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getToken, saveToken } from "../credentials.js";

export async function runRegister(options: {
    gatewayUrl?: string;
    token?: string;
    domain?: string;
    dir?: string;
}): Promise<void> {
    const projectDir = options.dir ?? process.cwd();

    const gatewayUrl =
        options.gatewayUrl ??
        process.env.DIRX_GATEWAY_URL ??
        "https://api.dirx.ai";
    const domain = options.domain ?? process.env.DIRX_DOMAIN;
    if (!domain) {
        throw new Error(
            "Domain is required. Use --domain or DIRX_DOMAIN env var.",
        );
    }

    const token = await resolveToken({
        token: options.token,
        domain,
        gatewayUrl,
    });

    const dirMdPath = join(projectDir, "DIR.md");
    let dirMd: string;
    try {
        dirMd = await readFile(dirMdPath, "utf-8");
    } catch {
        throw new Error(
            `DIR.md not found at ${dirMdPath}. Run 'dirx init' first.`,
        );
    }

    if (!dirMd.trim()) {
        throw new Error(`DIR.md is empty at ${dirMdPath}`);
    }

    const baseUrl = gatewayUrl.replace(/\/$/, "");
    const url = `${baseUrl}/registry/services?domain=${encodeURIComponent(domain)}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/markdown",
        },
        body: dirMd,
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Registration failed (${res.status}): ${body}`);
    }

    const result = (await res.json()) as {
        ok: boolean;
        domain: string;
        name: string;
    };
    console.log(`Registered ${result.name} as ${result.domain}`);
}

async function resolveToken(options: {
    token?: string;
    domain?: string;
    gatewayUrl?: string;
}): Promise<string> {
    // 1. --token flag
    if (options.token) return options.token;

    // 2. DIRX_PUBLISH_TOKEN env
    if (process.env.DIRX_PUBLISH_TOKEN) return process.env.DIRX_PUBLISH_TOKEN;

    // 3. ~/.dirx/credentials.json (domain-scoped)
    if (options.domain) {
        const stored = await getToken(options.domain);
        if (stored) return stored;

        // 3b. Token expired -> auto-renew from gateway
        const gw = options.gatewayUrl ?? process.env.DIRX_GATEWAY_URL;
        if (gw) {
            const renewed = await renewToken(gw, options.domain);
            if (renewed) return renewed;
        }
    }

    throw new Error(
        "No auth token found. Use `dirx claim <domain>` to obtain a publish token, or provide --token.",
    );
}

async function renewToken(
    gatewayUrl: string,
    domain: string,
): Promise<string | null> {
    const baseUrl = gatewayUrl.replace(/\/$/, "");
    try {
        const res = await fetch(`${baseUrl}/domains/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { publishToken?: string };
        if (!data.publishToken) return null;
        await saveToken(domain, data.publishToken);
        console.log(`Token renewed for ${domain}`);
        return data.publishToken;
    } catch {
        return null;
    }
}
