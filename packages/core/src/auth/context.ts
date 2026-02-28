/**
 * AgentContext — request-scoped context extracted from a verified JWT.
 *
 * Provides typed access to the agent identity, roles, and org/team scope.
 * Created by the Guard middleware and attached to the request.
 */

import type { DirxTokenPayload } from "./jwks.js";

export class AgentContext {
    readonly sub: string;
    readonly svc: string;
    readonly roles: readonly string[];
    readonly orgId: string | undefined;
    readonly teamId: string | undefined;
    readonly raw: DirxTokenPayload;

    constructor(payload: DirxTokenPayload) {
        this.sub = payload.sub;
        this.svc = payload.svc ?? "unknown";
        this.roles = Object.freeze(payload.roles ?? []);
        this.orgId = payload.org_id;
        this.teamId = payload.team_id;
        this.raw = payload;
    }

    hasRole(role: string): boolean {
        return this.roles.includes(role);
    }

    isAgent(): boolean {
        return this.hasRole("agent");
    }

    isAdmin(): boolean {
        return this.hasRole("admin");
    }

    /** Token expiry as Date, or null if no exp claim. */
    get expiresAt(): Date | null {
        return this.raw.exp ? new Date(this.raw.exp * 1000) : null;
    }
}
