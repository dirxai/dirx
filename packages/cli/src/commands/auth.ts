/**
 * Auth command: authenticate with the DirX gateway.
 *
 * POST /auth/token — public endpoint, no pre-auth required.
 */

import { saveAgentToken } from "../credentials.js";

export async function runAuth(opts: {
    gatewayUrl?: string;
}): Promise<void> {
    const gatewayUrl =
        opts.gatewayUrl ??
        process.env.DIRX_GATEWAY_URL ??
        "https://api.dirx.ai";

    const sub = `agent-${Date.now()}`;

    const res = await fetch(`${gatewayUrl.replace(/\/$/, "")}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            sub,
            svc: "gateway",
            roles: ["agent"],
            expiresIn: "24h",
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Auth failed (${res.status}): ${body}`);
    }

    const { token } = (await res.json()) as { token: string };

    await saveAgentToken(gatewayUrl, token);

    console.log("Authenticated with gateway");
    console.log(`  Token saved to ~/.dirx/credentials.json`);
    console.log(`  Gateway: ${gatewayUrl}`);
}
