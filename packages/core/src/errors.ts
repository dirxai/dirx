/**
 * DirX error codes and typed error class.
 *
 * Mirrors the server-side DirxEnvelope error model so SDK consumers
 * can handle errors uniformly across CLI, SDK, and server.
 */

export const DirxErrorCode = {
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    BAD_REQUEST: "BAD_REQUEST",
    RATE_LIMITED: "RATE_LIMITED",
    UPSTREAM_ERROR: "UPSTREAM_ERROR",
    INTERNAL: "INTERNAL",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_INVALID: "TOKEN_INVALID",
    JWKS_FETCH_FAILED: "JWKS_FETCH_FAILED",
} as const;

export type DirxErrorCode = (typeof DirxErrorCode)[keyof typeof DirxErrorCode];

const HTTP_STATUS: Record<DirxErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    RATE_LIMITED: 429,
    UPSTREAM_ERROR: 502,
    INTERNAL: 500,
    TOKEN_EXPIRED: 401,
    TOKEN_INVALID: 401,
    JWKS_FETCH_FAILED: 502,
};

export class DirxError extends Error {
    readonly code: DirxErrorCode;
    readonly statusCode: number;

    constructor(code: DirxErrorCode, message: string) {
        super(message);
        this.name = "DirxError";
        this.code = code;
        this.statusCode = HTTP_STATUS[code];
    }

    toJSON(): { code: DirxErrorCode; message: string; statusCode: number } {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
        };
    }
}
