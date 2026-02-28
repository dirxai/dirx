/**
 * @dirxai/core — Server-side SDK for DirX.
 *
 * Provides Guard middleware, JWKS-based JWT verification, AgentContext,
 * and a typed error model for building DirX-compatible services.
 */

export { Guard, createGuard, type GuardOptions } from "./middleware/guard.js";
export {
    JwksClient,
    type JwksClientOptions,
    type DirxTokenPayload,
} from "./auth/jwks.js";
export { AgentContext } from "./auth/context.js";
export { DirxError, DirxErrorCode } from "./errors.js";
