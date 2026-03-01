/**
 * @dirxai/core — DirX SDK for Node.js.
 *
 * Provides:
 * - Scanner: framework detection + route extraction (CLI & third-party)
 * - Types: DirxEnvelope, service/endpoint descriptors, provider hints
 * - Guard: JWKS-based JWT middleware for protecting services
 * - Errors: typed DirxError with HTTP status mapping
 */

// Scanner
export {
    detectFramework,
    detectFrameworkFromDeps,
    hasDirxSdk,
    scanRoutes,
    getRoutePatterns,
    extractRoutesRegex,
    extractPrismaModelNames,
    type DetectedStack,
    type RouteHint,
} from "./scanner/index.js";

// Types
export {
    getAuthHint,
    type DirxEnvelope,
    type DirxEndpoint,
    type DirxService,
    type SearchResult,
    type EndpointMatch,
    type ByokAuth,
    type ProviderHint,
} from "./types.js";

// Auth / Guard
export { Guard, createGuard, type GuardOptions } from "./middleware/guard.js";
export {
    JwksClient,
    type JwksClientOptions,
    type DirxTokenPayload,
} from "./auth/jwks.js";
export { AgentContext } from "./auth/context.js";

// Generator
export {
    generateDirMd,
    generateDirJson,
    type GenerateOptions,
} from "./generator.js";

// Errors
export { DirxError, DirxErrorCode } from "./errors.js";
