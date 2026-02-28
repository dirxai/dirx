/**
 * @dirxai/core/testing — Test utilities for DirX SDK consumers.
 *
 * Provides helpers to create mock AgentContext and tokens for unit tests
 * without requiring a real JWKS endpoint.
 */

import { AgentContext } from "./auth/context.js";
import type { DirxTokenPayload } from "./auth/jwks.js";

export interface MockAgentOptions {
    sub?: string;
    svc?: string;
    roles?: string[];
    orgId?: string;
    teamId?: string;
    expiresInSeconds?: number;
}

/**
 * Create a mock AgentContext for testing.
 * No real JWT or JWKS involved — purely in-memory.
 */
export function createMockAgent(options?: MockAgentOptions): AgentContext {
    const now = Math.floor(Date.now() / 1000);
    const payload: DirxTokenPayload = {
        sub: options?.sub ?? "test-agent",
        svc: options?.svc ?? "test",
        roles: options?.roles ?? ["agent"],
        org_id: options?.orgId,
        team_id: options?.teamId,
        iat: now,
        exp: now + (options?.expiresInSeconds ?? 3600),
        iss: "https://api.dirx.ai",
        aud: "dirx",
    };
    return new AgentContext(payload);
}

export { AgentContext } from "./auth/context.js";
export type { DirxTokenPayload } from "./auth/jwks.js";
