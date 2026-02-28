import { describe, it, expect } from "vitest";
import { getAuthHint } from "../src/types.js";

describe("getAuthHint", () => {
    it("returns hint for known provider", () => {
        const hint = getAuthHint("api.github.com");
        expect(hint).not.toBeNull();
        expect(hint!.envVar).toBe("GITHUB_TOKEN");
        expect(hint!.guideUrl).toContain("github.com");
    });

    it("returns hint for OpenAI", () => {
        const hint = getAuthHint("api.openai.com");
        expect(hint).not.toBeNull();
        expect(hint!.envVar).toBe("OPENAI_API_KEY");
    });

    it("returns null for unknown provider", () => {
        expect(getAuthHint("unknown.example.com")).toBeNull();
    });
});
