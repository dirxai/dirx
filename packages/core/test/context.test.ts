import { describe, it, expect } from "vitest";
import { createMockAgent } from "../src/testing.js";

describe("AgentContext", () => {
    it("creates context with defaults", () => {
        const ctx = createMockAgent();
        expect(ctx.sub).toBe("test-agent");
        expect(ctx.svc).toBe("test");
        expect(ctx.isAgent()).toBe(true);
        expect(ctx.isAdmin()).toBe(false);
    });

    it("respects custom roles", () => {
        const ctx = createMockAgent({ roles: ["admin", "agent"] });
        expect(ctx.isAgent()).toBe(true);
        expect(ctx.isAdmin()).toBe(true);
        expect(ctx.hasRole("admin")).toBe(true);
        expect(ctx.hasRole("viewer")).toBe(false);
    });

    it("exposes org and team ids", () => {
        const ctx = createMockAgent({
            orgId: "org-123",
            teamId: "team-456",
        });
        expect(ctx.orgId).toBe("org-123");
        expect(ctx.teamId).toBe("team-456");
    });

    it("computes expiresAt from raw payload", () => {
        const ctx = createMockAgent({ expiresInSeconds: 7200 });
        expect(ctx.expiresAt).toBeInstanceOf(Date);
        const diff = ctx.expiresAt!.getTime() - Date.now();
        expect(diff).toBeGreaterThan(7100 * 1000);
        expect(diff).toBeLessThan(7300 * 1000);
    });

    it("roles array is frozen", () => {
        const ctx = createMockAgent({ roles: ["agent"] });
        expect(() => {
            (ctx.roles as string[]).push("hacker");
        }).toThrow();
    });
});
