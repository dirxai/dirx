/**
 * Provider map: domain → authentication setup hints.
 *
 * When an agent encounters an auth error, CLI looks up this map to provide
 * a friendly guide on how to obtain and configure the API key.
 */

interface ProviderHint {
    envVar?: string;
    guideUrl: string;
}

const providers: Record<string, ProviderHint> = {
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

export function getAuthHint(domain: string): ProviderHint | null {
    return providers[domain] ?? null;
}
