/**
 * Guard middleware — extracts and verifies Bearer tokens from incoming requests.
 *
 * Framework-agnostic: works with any Node.js HTTP framework that provides
 * standard Request/Response objects (Express, Hono, Fastify, etc.).
 *
 * Usage:
 *   import { createGuard } from "@dirxai/core";
 *   const guard = createGuard({ jwksUrl: "..." });
 *
 *   // Express
 *   app.use(guard.express());
 *
 *   // Generic (any framework)
 *   const ctx = await guard.authenticate(bearerToken);
 */

import { JwksClient, type JwksClientOptions } from "../auth/jwks.js";
import { AgentContext } from "../auth/context.js";
import { DirxError, DirxErrorCode } from "../errors.js";

export interface GuardOptions extends JwksClientOptions {
    /** If true, requests without a token are rejected. Default: true */
    required?: boolean;
}

export class Guard {
    private readonly client: JwksClient;
    private readonly required: boolean;

    constructor(options?: GuardOptions) {
        this.client = new JwksClient(options);
        this.required = options?.required !== false;
    }

    /**
     * Authenticate a raw Bearer token string.
     * Returns AgentContext on success.
     */
    async authenticate(token: string): Promise<AgentContext> {
        const payload = await this.client.verify(token);
        return new AgentContext(payload);
    }

    /**
     * Extract Bearer token from an Authorization header value.
     * Returns null if not present or malformed.
     */
    extractToken(authHeader: string | null | undefined): string | null {
        if (!authHeader) return null;
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
            return null;
        }
        return parts[1];
    }

    /**
     * Full flow: extract token from header → verify → return AgentContext.
     * Throws DirxError if required and no/invalid token.
     */
    async fromHeader(
        authHeader: string | null | undefined,
    ): Promise<AgentContext | null> {
        const token = this.extractToken(authHeader);
        if (!token) {
            if (this.required) {
                throw new DirxError(
                    DirxErrorCode.UNAUTHORIZED,
                    "Missing or malformed Authorization header",
                );
            }
            return null;
        }
        return this.authenticate(token);
    }

    /**
     * Express/Connect-style middleware factory.
     * Attaches `req.agent` (AgentContext) on success.
     */
    express(): (
        req: { headers: Record<string, string | undefined>; agent?: AgentContext },
        res: { status: (code: number) => { json: (body: unknown) => void } },
        next: (err?: unknown) => void,
    ) => Promise<void> {
        return async (req, res, next) => {
            try {
                const ctx = await this.fromHeader(req.headers.authorization);
                if (ctx) {
                    req.agent = ctx;
                }
                next();
            } catch (err) {
                if (err instanceof DirxError) {
                    res.status(err.statusCode).json({
                        ok: false,
                        error: { code: err.code, message: err.message },
                    });
                    return;
                }
                next(err);
            }
        };
    }
}

export function createGuard(options?: GuardOptions): Guard {
    return new Guard(options);
}
