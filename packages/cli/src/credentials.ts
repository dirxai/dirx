/**
 * Credential storage for DirX CLI.
 *
 * Stores agent tokens and domain-scoped publish tokens in ~/.dirx/credentials.json
 * with restrictive file permissions (0o600 on Unix).
 */

import { readFileSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface AgentTokenEntry {
    gatewayUrl: string;
    token: string;
    issuedAt?: number;
    expiresAt?: number;
}

export interface TokenEntry {
    token: string;
    issuedAt?: number;
    expiresAt?: number;
}

interface CredentialStore {
    agentToken?: AgentTokenEntry;
    tokens?: Record<string, TokenEntry>;
}

function credentialsPath(): string {
    const dirxHome = process.env.DIRX_HOME ?? join(homedir(), ".dirx");
    return join(dirxHome, "credentials.json");
}

function loadStore(): CredentialStore {
    try {
        const text = readFileSync(credentialsPath(), "utf-8");
        return JSON.parse(text) as CredentialStore;
    } catch {
        return {};
    }
}

function saveStore(store: CredentialStore): void {
    const filePath = credentialsPath();
    const dir = join(filePath, "..");
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(store, null, 2));
    try {
        chmodSync(filePath, 0o600);
    } catch {
        // chmod not supported on all platforms
    }
}

/** Decode JWT payload to extract iat/exp without verification. */
function decodeJwtPayload(token: string): { iat?: number; exp?: number } {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return {};
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf-8"),
        );
        return { iat: payload.iat, exp: payload.exp };
    } catch {
        return {};
    }
}

export async function saveAgentToken(
    gatewayUrl: string,
    token: string,
): Promise<void> {
    const store = loadStore();
    const { iat, exp } = decodeJwtPayload(token);
    store.agentToken = {
        gatewayUrl,
        token,
        issuedAt: iat,
        expiresAt: exp,
    };
    saveStore(store);
}

export async function getAgentToken(): Promise<AgentTokenEntry | null> {
    const store = loadStore();
    if (!store.agentToken) return null;

    // Check expiration
    if (store.agentToken.expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (now >= store.agentToken.expiresAt) return null;
    }

    return store.agentToken;
}

export async function saveToken(
    domain: string,
    token: string,
): Promise<void> {
    const store = loadStore();
    const { iat, exp } = decodeJwtPayload(token);
    if (!store.tokens) store.tokens = {};
    store.tokens[domain] = { token, issuedAt: iat, expiresAt: exp };
    saveStore(store);
}

export async function getToken(domain: string): Promise<string | null> {
    const store = loadStore();
    const entry = store.tokens?.[domain];
    if (!entry) return null;

    if (entry.expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (now >= entry.expiresAt) return null;
    }

    return entry.token;
}
