import { describe, it, expect, vi, afterEach } from "vitest";
import { runClaim } from "../../src/commands/claim.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("runClaim", () => {
    it("requests challenge and prints DNS instructions", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    domain: "example.com",
                    txtRecord: "_dirx.example.com",
                    txtValue: "dirx-verify=abc123",
                    expiresAt: Date.now() + 3600_000,
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            ),
        );
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await runClaim({
            gatewayUrl: "https://test.example.com",
            domain: "example.com",
        });

        const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
        expect(output).toContain("_dirx.example.com");
        expect(output).toContain("dirx-verify=abc123");
    });

    it("throws on challenge failure", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response("Bad Request", { status: 400 }),
        );

        await expect(
            runClaim({
                gatewayUrl: "https://test.example.com",
                domain: "bad.com",
            }),
        ).rejects.toThrow("Challenge request failed (400)");
    });

    it("verifies domain and saves token", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({ publishToken: "pub-token-123" }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            ),
        );

        const credentials = await import("../../src/credentials.js");
        vi.spyOn(credentials, "saveToken").mockResolvedValue();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await runClaim({
            gatewayUrl: "https://test.example.com",
            domain: "example.com",
            verify: true,
        });

        const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
        expect(output).toContain("verified successfully");
    });
});
