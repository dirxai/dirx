/**
 * Shared DirX types for CLI, SDK, and server interop.
 *
 * DirxEnvelope is the canonical response wrapper used by the gateway.
 * All other types define the domain model for DirX services.
 */

// ---------------------------------------------------------------------------
// Gateway Envelope
// ---------------------------------------------------------------------------

export interface DirxEnvelope<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string | { code: string; message: string };
    meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Service / Endpoint descriptors
// ---------------------------------------------------------------------------

export interface DirxEndpoint {
    path: string;
    method: string;
    description?: string;
}

export interface DirxService {
    title: string;
    description?: string;
    base_url: string;
    actions: string[];
    endpoints: DirxEndpoint[];
}

// ---------------------------------------------------------------------------
// Search results
// ---------------------------------------------------------------------------

export interface SearchResult {
    domain: string;
    title: string;
    description?: string;
    path?: string;
    score?: number;
    matched_endpoints?: EndpointMatch[];
}

export interface EndpointMatch {
    method: string;
    path: string;
    description?: string;
}

// ---------------------------------------------------------------------------
// BYOK (Bring Your Own Key)
// ---------------------------------------------------------------------------

export interface ByokAuth {
    type: string;
    token?: string;
    header?: string;
    key?: string;
}

// ---------------------------------------------------------------------------
// Provider hints
// ---------------------------------------------------------------------------

export interface ProviderHint {
    envVar?: string;
    guideUrl: string;
}

const KNOWN_PROVIDERS: Record<string, ProviderHint> = {
    "api.github.com": {
        envVar: "GITHUB_TOKEN",
        guideUrl: "https://github.com/settings/tokens",
    },
    "api.openai.com": {
        envVar: "OPENAI_API_KEY",
        guideUrl: "https://platform.openai.com/api-keys",
    },
    "api.anthropic.com": {
        envVar: "ANTHROPIC_API_KEY",
        guideUrl: "https://console.anthropic.com/settings/keys",
    },
    "generativelanguage.googleapis.com": {
        envVar: "GOOGLE_API_KEY",
        guideUrl: "https://aistudio.google.com/apikey",
    },
    "api.stripe.com": {
        envVar: "STRIPE_SECRET_KEY",
        guideUrl: "https://dashboard.stripe.com/apikeys",
    },
};

/**
 * Get authentication hint for a known provider domain.
 */
export function getAuthHint(domain: string): ProviderHint | null {
    return KNOWN_PROVIDERS[domain] ?? null;
}
