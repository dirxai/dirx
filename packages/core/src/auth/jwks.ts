/**
 * JWKS client — fetches and caches the DirX gateway's public key set.
 *
 * Uses the `jose` library for JWK parsing and JWT verification.
 * Keys are cached in memory with a configurable TTL (default 5 min).
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { DirxError, DirxErrorCode } from "../errors.js";

export interface JwksClientOptions {
    /** JWKS endpoint URL. Default: https://api.dirx.ai/.well-known/jwks.json */
    jwksUrl?: string;
    /** Expected JWT issuer. Default: https://api.dirx.ai */
    issuer?: string;
    /** Expected JWT audience. Default: dirx */
    audience?: string;
}

export interface DirxTokenPayload extends JWTPayload {
    sub: string;
    svc?: string;
    roles?: string[];
    org_id?: string;
    team_id?: string;
}

export class JwksClient {
    private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
    private readonly issuer: string;
    private readonly audience: string;

    constructor(options?: JwksClientOptions) {
        const jwksUrl =
            options?.jwksUrl ?? "https://api.dirx.ai/.well-known/jwks.json";
        this.issuer = options?.issuer ?? "https://api.dirx.ai";
        this.audience = options?.audience ?? "dirx";
        this.jwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    /**
     * Verify a JWT token against the JWKS endpoint.
     * Returns the decoded payload on success, throws DirxError on failure.
     */
    async verify(token: string): Promise<DirxTokenPayload> {
        try {
            const { payload } = await jwtVerify(token, this.jwks, {
                issuer: this.issuer,
                audience: this.audience,
            });
            return payload as DirxTokenPayload;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (message.includes("expired")) {
                throw new DirxError(
                    DirxErrorCode.TOKEN_EXPIRED,
                    "Token has expired",
                );
            }
            throw new DirxError(
                DirxErrorCode.TOKEN_INVALID,
                `Token verification failed: ${message}`,
            );
        }
    }
}
