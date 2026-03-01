import { describe, it, expect, vi, afterEach } from "vitest";
import { runAuth } from "../../src/commands/auth.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("runAuth", () => {
    it("throws on non-200 response", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response("Unauthorized", { status: 401 }),
        );

        await expect(
            runAuth({ gatewayUrl: "https://test.example.com" }),
        ).rejects.toThrow("Auth failed (401)");
    });

    it("saves token on success", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ token: "test-jwt-token" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const credentials = await import("../../src/credentials.js");
        const saveSpy = vi.spyOn(credentials, "saveAgentToken").mockResolvedValue();
        vi.spyOn(console, "log").mockImplementation(() => {});

        await runAuth({ gatewayUrl: "https://test.example.com" });

        expect(saveSpy).toHaveBeenCalledWith(
            "https://test.example.com",
            "test-jwt-token",
        );
    });
});
