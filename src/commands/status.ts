/**
 * Status command: show current DirX CLI configuration and auth status.
 */

import { getAgentToken } from "../credentials.js";

export async function runStatus(): Promise<void> {
    const gatewayUrl =
        process.env.DIRX_GATEWAY_URL ?? "https://api.dirx.ai";

    console.log(`DirX CLI Status\n`);
    console.log(`  Gateway:  ${gatewayUrl}`);

    const stored = await getAgentToken();
    if (stored) {
        const hint = stored.token.length > 8
            ? `${stored.token.slice(0, 4)}...${stored.token.slice(-4)}`
            : "********";
        console.log(`  Token:    ${hint}`);
        console.log(`  Server:   ${stored.gatewayUrl}`);
        if (stored.expiresAt) {
            const expDate = new Date(stored.expiresAt * 1000);
            const now = new Date();
            if (expDate > now) {
                console.log(`  Expires:  ${expDate.toISOString()}`);
            } else {
                console.log(`  Expires:  EXPIRED (${expDate.toISOString()})`);
            }
        }
    } else {
        console.log(`  Token:    not set (run 'dirx auth')`);
    }
}
